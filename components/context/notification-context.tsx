"use client"

import React, {useRef, useState} from 'react';

const NotificationContext = React.createContext({
  notification: null as STATE|null,
  notificationText: null as string|null,
  info: (text: string) => {},
  error: (text: string) => {},
  clear: () => {}
});

export const enum STATE {
  INFO,
  ERROR
}

const DEFAULT_NOTIFICATION_TIME_MS = 5000;


const NotificationProvider = (props: {children: any}) => {
  const [notification, setNotification] = useState<STATE|null>(null);
  const [notificationText, setNotificationText] = useState<string|null>(null);
  const timeOut = useRef<any>(null);

  function startNotificationTimeout(timeoutMs?: number) {
    clearTimeout(timeOut.current);
    timeOut.current = setTimeout(() => {
      clear();
    }, timeoutMs? timeoutMs: DEFAULT_NOTIFICATION_TIME_MS);
  }

  const info = (text: string, timeoutMs?: number) => {
    setNotificationText(text);
    setNotification(STATE.INFO);
    startNotificationTimeout(timeoutMs)
  };
  const error = (text: string, timeoutMs?: number) => {
    setNotificationText(text);
    setNotification(STATE.ERROR);
    startNotificationTimeout(timeoutMs)
  };
  const clear = () => {
    setNotificationText(null);
    setNotification(null);
  };

  return (
    <NotificationContext.Provider
      value={{
        info, error, clear, notification, notificationText,
      }}
    >
      {props.children}
    </NotificationContext.Provider>
  );
};

export { NotificationProvider };
export {NotificationContext};
