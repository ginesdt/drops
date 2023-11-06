import {prisma} from "@/lib/globals";
import {Address, DBMessage, DBUser, Media} from "@/lib/types";
import {DEFAULT_LIMIT} from "@/lib/constants";
import {Prisma, Message as PrismaMessage, Vote} from ".prisma/client";
import SortOrder = Prisma.SortOrder;
import deepmerge from "deepmerge";
import {LSP3ProfileMetadata} from "@lukso/lsp-smart-contracts";

import {ipfsToUrlIfApplicable} from "@/lib/ipfs";


function toDBTags(tags: any[]|undefined) : string[]|undefined {
  if (!tags)
    return undefined
  return tags.map(t => t.tag.name)
}

function toDBMedias(medias: any[]|undefined) : Media[]|undefined {
  return medias
}

function toDBCategory(category: {name: string}|undefined) : string|undefined {
  if (!category)
    return undefined
  return category.name
}

function toDBLikes(votes: Vote[]): number {
  return votes.reduce((agg, current) => agg + (current.like ? 1: -1), 0)
}

function toDBMessage(message: any) : DBMessage {
  return {...message, ...{
    timestamp: message.timestamp.getTime(),
    inReplyTo: message.inReplyTo ?? undefined,
    hidden: message.hidden ?? undefined,
    category: toDBCategory(message.category),
    categoryId: undefined,
    tags: toDBTags(message.tags),
    medias: toDBMedias(message.medias),
    user: toDBUser(message.user),
    likes: toDBLikes(message.votes)
  }};
}

function toDBUser(user: any) : DBUser {
  return {...user, ...{
      name: user.name ?? undefined,
      description: user.description ?? undefined,
      avatar: user.avatar ?? undefined,
      profileImage: user.profileImage ?? undefined,
      backgroundImage: user.backgroundImage ?? undefined,
      tags: user.tags?? undefined,
      links: user.links?? undefined,
      messagesCount: user._count?.messages ?? 0,
      followersCount: user._count?.following ?? 0
    }};
}

export async function addMessage(message: DBMessage): Promise<void> {
  const tagIds: number[] = []
  if (message.tags) {
    for (const tag of message.tags) {
      const tags = await prisma.tag.upsert({
        where: {name: tag},
        update: {},
        create: {name: tag}
      });
      tagIds.push(tags.id);
    }
  }
  let categoryId: number|undefined = undefined
  if (message.category) {
    const category = await prisma.category.upsert({
      where: {name: message.category},
      update: {},
      create: {name: message.category}
    })
    categoryId = category.id;
  }
  await prisma.message.upsert({
    where: {hash: message.hash},
    create: {...message,
      ...{
        sender: undefined,
        timestamp: new Date(message.timestamp),
        user: {
          connect:{
            address: message.sender
          }},
        tags: {
          create:
            tagIds.map(tagId => {return {
              tag:{
                connect: {id: tagId}
              }
            }
            })
        },
        medias: message.medias ? {
          create: message.medias.map(media => {
            return {
              url: media.url,
              type: media.type
            }
          })
        }: undefined,
        category: categoryId ? {
          connect: {
            id: categoryId
          }
        } : undefined}},
    update: {},
  });
}

export async function updateLastHash(user: Address, hash: string) {
  await prisma.user.upsert({
    where: {
      address: user
    },
    update: {
      lastHash: hash},
    create: {
      address: user,
      lastHash: hash}
  });
}

export async function updateUser(user: Address, {storageInfoLink, lastHash, indexLink}: {storageInfoLink?: string, lastHash?: string, indexLink?: string}) {
  await prisma.user.update({
    where: {
      address: user
    },
    data: {
      storageInfoLink,
      lastHash,
      indexLink
    }});
}

export async function getUserInfo(userAddress: Address): Promise<DBUser|undefined> {
  const user = await prisma.user.findFirst({
    where: {
      address: userAddress
    },
    include: {
      _count: {
        select: {
          following: true,
          messages: true
        }
      }
    }
  });
  if (user)
    return toDBUser(user);
}

export async function getMessages({limit = DEFAULT_LIMIT, before, beforeId, sender, onlyParentComments, includeReplies, category, onlyFollowing, messageHash, origin}:
                                    {limit: number, before:number|undefined, beforeId: string|undefined, sender?: string, onlyParentComments: boolean,
                                      includeReplies: boolean, category?: string, onlyFollowing: boolean, messageHash?: string, origin?: string}): Promise<DBMessage[]> {
  let filter = {
    hidden: false
  }

  if (sender) {
    filter = deepmerge(filter, {
      AND: {
        sender: sender
      }
    });
  }

  if (onlyParentComments) {
    filter = deepmerge(filter, {
      AND: {
        inReplyTo: null
      }
    })
  }

  if (category) {
    filter = deepmerge(filter, {
      AND: {
        category: {
          name: category
        }
      }
    })
  }

  if (messageHash) {
    filter = deepmerge(filter, {
      AND: {
        hash: messageHash
      }
    })
  }

  if (origin) {
    filter = deepmerge(filter, {
      AND: {
        origin: {
          startsWith: origin
        }
      }
    })
  }

  if (before && beforeId) {
    filter = deepmerge(filter, {
      AND: {
        OR: [
          {
            AND: {
              timestamp: new Date(before),
              hash: {
                lt: beforeId
              }
            }
          },
          {
            timestamp: {
              lt: new Date(before)
            }
          }
        ]
      }
    })
  } else if (before) {
    filter = deepmerge(filter, {
      AND: {
        timestamp: {
          lt: before
        }
      }
    })
  }

  if (sender && onlyFollowing) {
    // TODO merge this into the main query for better performance
    const following = await prisma.follower.findMany({
      select: {
        following: true
      },
      where: {
        follower: sender
      }});

    filter = deepmerge(filter, {
      AND: {
        sender: {
          in: following.map(f => f.following)
        }
      }
    })
  }

  if (includeReplies) {
    const messages = await prisma.message.findMany(
      {
        select:{
          hash: true
        },
        take: limit,
        where: filter,
        orderBy: [{timestamp: SortOrder.desc}, {hash: SortOrder.desc}],
      });

    const hashes = new Set(messages.map((m: {hash: string}) => m.hash));
    const hashesStr = `'${Array.from(hashes).join("\',\'")}'`;
    const replies = await prisma.$queryRawUnsafe(`WITH RECURSIVE replies AS ( SELECT * FROM "Message" WHERE hash in (${hashesStr}) UNION ALL SELECT c.* FROM "Message" c JOIN replies p ON p.hash = c."inReplyTo" WHERE c.hidden = False AND p.hidden = False ) SELECT hash, "inReplyTo" FROM replies`) as PrismaMessage[]
    // const replies = await prisma.$queryRawUnsafe(`with recursive replies AS ( select * from Message where hash in (${hashesStr}) union all select c.* from Message c join replies p on p.hash = c.inReplyTo where c.hidden = 0 and p.hidden = 0 ) select hash, inReplyTo from replies`) as PrismaMessage[]

    const repliesFull = await prisma.message.findMany(
      {
        where: {hash: {in: replies.map(r => r.hash)}},
        include: {
          tags: {
            include:{
              tag: {
                select:{
                  name: true}}}},
          medias: {
            select:{
            url: true,
            type: true}},
          category: {
            select: {
              name: true
            }},
          user: {
            include: {
              _count: true,
            }},
          votes: true
        },
        orderBy: [{timestamp: SortOrder.desc}, {hash: SortOrder.desc}],
      });

    const messageMap = new Map<string, DBMessage>();
    repliesFull.forEach((m: {hash: string}) => messageMap.set(m.hash, toDBMessage(m)));
    messageMap.forEach((m) => {
      if (m.inReplyTo) {
        const parentPost = messageMap.get(m.inReplyTo);
        if (parentPost) {
          if (!parentPost.replies) {
            parentPost.replies = [];
          }
          parentPost.replies.push(m);
        }
      }
    })

    return Array.from(messageMap.values()).filter(m => hashes.has(m.hash))
  }

  const messages = await prisma.message.findMany(
    {
      take: limit,
      where: filter,
      orderBy: [{timestamp: SortOrder.desc}, {hash: SortOrder.desc}],
      include: {
        tags: {
          include:{
            tag: {
              select:{
                name: true}}}},
        medias: {
          select:{
            url: true}},
        category: {
          select: {
            name: true
          }},
        user: {
          include: {
            _count: true,
          }},
        votes: true
      }
    });

  return messages.map(toDBMessage)
}

export async function getLastMessageHash(userAddress: Address): Promise<string|undefined> {
  const user = await prisma.user.findFirst({
    where: {
      address: userAddress
    },
  });
  if (user)
    return user.lastHash;
}

export async function updateUserProfile(user: Address, userProfile: LSP3ProfileMetadata) {
  await prisma.user.update({
    where: {
      address: user},
    data: {
      name: userProfile.name,
      description: userProfile.description,
      tags: userProfile.tags?.join(","),
      links: userProfile.links?.map(l => l.url).join(","),
      avatar: ipfsToUrlIfApplicable(userProfile.avatar?.[0]?.url),
      profileImage: ipfsToUrlIfApplicable(userProfile.profileImage?.[0]?.url),
      backgroundImage: ipfsToUrlIfApplicable(userProfile.backgroundImage?.[0]?.url)
    }
  });
}

export async function vote({sender, messageHash, isLike} : {sender: Address, messageHash: string, isLike: boolean}) {
  await prisma.vote.upsert({
    where: {
      sender_hash:{
        sender: sender,
        hash: messageHash
      }},
    update: {
      like: isLike
    },
    create: {
      sender: sender,
      hash: messageHash,
      like: isLike
    }
  });
}

export async function hideMessage({sender, messageHash} : {sender: Address, messageHash: string}) {
  await prisma.message.update({
    where: {
      sender: sender,
      hash: messageHash
    },
    data: {
      hidden: true
    }
  })
}

export async function follow({follower, following, isFollow} : {follower: Address, following: Address, isFollow: boolean}) {
  if (isFollow) {
    await prisma.follower.upsert({
      where: {
        follower_following: {
          follower: follower,
          following: following
        }},
      update: {},
      create: {
        follower: follower,
        following: following
      }
    });
  } else {
    await prisma.follower.delete( {
      where: {
        follower_following: {
          follower: follower,
          following: following
        }
      }
    })
  }
}

export async function getLikes({address, hashes}: {address: Address, hashes: string[]}): Promise<{[hash: string]: boolean | null}> {
  const votes = await prisma.vote.findMany({
    where: {
      sender: address,
      hash: {
        in: hashes
      }
    }}
  )
  const hashToVote = new Map(votes.map(v => [v.hash, v]))
  return hashes.reduce((acc: {[hash: string]: boolean | null}, curr) => {
    const vote = hashToVote.get(curr);
    acc[curr] = vote? vote.like: null;
    return acc;
  }, {})
}

export async function getFollowing({address, users}: {address: Address, users: Address[]}): Promise<{[user: string]: boolean}> {
  const following = await prisma.follower.findMany({
    where: {
      follower: address,
      following: {
        in: users
      }
    }
  })

  const followingSet = new Set(following.map(f => f.following))

  return users.reduce((acc: {[user: Address]: boolean}, curr) => {
    acc[curr] = followingSet.has(curr);
    return acc;
  }, {})
}
