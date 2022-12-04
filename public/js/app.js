// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.14.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.14.0/firebase-analytics.js";
import { getAuth, connectAuthEmulator, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/9.14.0/firebase-auth.js";
import { getFirestore, connectFirestoreEmulator, doc, collection, addDoc, orderBy, query, serverTimestamp, onSnapshot, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.14.0/firebase-firestore.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCzwREWsuUH1rkRDioBwF1RJML8zb317sw",
    authDomain: "todo-420.firebaseapp.com",
    projectId: "todo-420",
    storageBucket: "todo-420.appspot.com",
    messagingSenderId: "189238120029",
    appId: "1:189238120029:web:7e2414e3e90fc3aca507b4",
    measurementId: "G-EZ5NS8DEKL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app)

const provider = new GoogleAuthProvider();

// emulator connections
if (window.location.hostname == "localhost" || window.location.hostname == "127.0.0.1") {
    connectAuthEmulator(auth, "http://localhost:9099");
    connectFirestoreEmulator(db, 'localhost', 8080);
}


$(document).ready(function () {
    // variables
    var update_todo_id = undefined;

    // check for user login status
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in, see docs for a list of available properties
            // https://firebase.google.com/docs/reference/js/firebase.User
            const uid = user.uid;
            console.log("User is signed in");
            $('.login').show();
            $('.logout').hide();
        } else {
            // User is signed out
            console.log("User is signed out");
            $('.login').hide();
            $('.logout').show();
        }
        $('body').show();
        listner();
    });

    // login with google
    $('#loginBtn').click(async function () {
        await signInWithPopup(auth, provider);
    });

    // logout code
    $('#logoutBtn').click(async function () {
        await signOut(auth);
    });

    // add todo to firestore
    $('#add_todo_btn').click(async function () {
        var inputTodo = $('#input_todo').val();
        const docRef = await addDoc(collection(db, `users/${auth.currentUser.uid}/todos`), {
            text: inputTodo,
            timestamp: serverTimestamp()
        });
        $('#input_todo').val('');
        $('#add_todo_modal').modal('toggle');
    });

    // outer update todo click
    $(document).on('click', '.update-todo', function () {
        $("#add_todo_btn").hide();
        $("#update_todo_btn").show();
        var previousTodo = $(this).parent().siblings("span").html();
        $('#input_todo').val(previousTodo);
        update_todo_id = $(this).parents('.todo-item').attr('id');
    });

    // inner update todo click
    $('#update_todo_btn').click(async function () {
        var newTodo = $('#input_todo').val();
        const docRef = doc(db, 'users', auth.currentUser.uid, 'todos', update_todo_id);
        await updateDoc(docRef, {
            text: newTodo
        });
        update_todo_id = undefined;
        $('#input_todo').val('');
        $('#add_todo_modal').modal('toggle');
    });

    // delete todo to firestore
    $(document).on('click', '.delete-todo', async function () {
        var todoId = $(this).parents('.todo-item').attr('id');
        const docRef = doc(db, 'users', auth.currentUser.uid, 'todos', todoId);
        await deleteDoc(docRef);
    });

    // handle plus button click
    $('.btn-plus').click(function () {
        $("#add_todo_btn").show();
        $("#update_todo_btn").hide();
    });

    // real time listners
    async function listner() {
        if (await auth.currentUser) {
            const q = query(collection(db, `users/${auth.currentUser.uid}/todos`), orderBy("timestamp"));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === "added") {
                        // add todo to list
                        $('.todo-list').append(`

                        <li class="todo-item" id="${change.doc.id}">
                            <span>${change.doc.data().text}</span>
                            <div>
                                <button class="update-todo" data-bs-toggle="modal" data-bs-target="#add_todo_modal"><i class="bi bi-pencil"></i></button>
                                <button class="delete-todo"><i class="bi bi-trash"></i></button>
                            </div>
                        </li>

                        `);
                    }
                    if (change.type === "modified") {
                        // update todo to list
                        $(`#${change.doc.id} > span`).html(`${change.doc.data().text}`);
                    }
                    if (change.type === "removed") {
                        // delete todo to list
                        $(`#${change.doc.id}`).remove();
                    }
                });
            });
        } else {
            $('.todo-list').html('');
        }
    }

});
