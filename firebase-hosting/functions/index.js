// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access Cloud Firestore.
const admin = require('firebase-admin');
admin.initializeApp();

// 関数をasyncにする
exports.createUserDocument = functions.auth.user().onCreate(async user => {

    console.log("TEST");

    const userUid = user.uid;
    const userEmail = user.email;

    // admin.auth().getUser() 経由で取得, 取得するまでawait
    const authedUser = await admin.auth().getUser(userUid);
    const userName = authedUser.displayName;

    const newUser = {
        email: userEmail,
        name: userName
    };

    return admin
        .firestore()
        .collection("users")
        .doc(userUid)
        .set(newUser);
});