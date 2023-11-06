"use client"

import React from 'react';
import { useContext } from 'react';
import {NotificationContext, STATE} from "@/components/context/notification-context";

const NotificationBar = () => {
  const notificationCtx = useContext(NotificationContext);
  const isHidden = notificationCtx.notification == null;
  const isError = notificationCtx.notification === STATE.ERROR;
  return (
    <div className={`mx-auto w-fit fixed inset-x-0 bottom-20 z-10 ${isError ? "bg-red-200": "bg-blue-200"} text-black font-bold py-4 px-10 rounded-lg transition-opacity duration-300 ${isHidden ? " opacity-0" : ""}`} >
      <p>{notificationCtx.notificationText}</p>
    </div>

  );
};

export default NotificationBar;
