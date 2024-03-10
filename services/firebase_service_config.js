const {initializeApp, cert} = require('firebase-admin/app');
const {getFirestore, FieldValue} = require('firebase-admin/firestore');
const serviceAccount = require('../secure_keys/serviceAccountKey.json');

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// const firebaseConfig = {
//   apiKey: "AIzaSyAHNWOQxPSkE7GBmQSqAS-YoQopvQjSE3E",
//   authDomain: "olhms-app.firebaseapp.com",
//   projectId: "olhms-app",
//   storageBucket: "olhms-app.appspot.com",
//   messagingSenderId: "504490221263",
//   appId: "1:504490221263:web:1b4fd581fac8291dcee1ba",
//   measurementId: "G-7XV9T9S22M"
// };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);

initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();
const FsConversation = db.collection('conversations'); 
const FsStudent = db.collection('students');
const FsGuardian = db.collection('guardians');
const FsAdmin = db.collection('admins');

module.exports = {FsConversation, FieldValue, FsStudent, FsGuardian, FsAdmin, db};