// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyCSwgFDnHkF1oq0ZGya2MdDTYSCts3-PSY",
    authDomain: "contech-30b16.firebaseapp.com",
    projectId: "contech-30b16",
    storageBucket: "contech-30b16.firebasestorage.app",
    messagingSenderId: "416478136900",
    appId: "1:416478136900:web:abd56c93760c42059eca11",
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Optional: Handle background messages specifically
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    // Custom logic if needed, but usually the browser handles the notification UI automatically
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/logo192.png' // path to your logo
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});