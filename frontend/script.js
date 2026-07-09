console.log("congrats it loaded");



//------------------------------------ Imports -----------------------------------------

import Fuse from "https://cdn.jsdelivr.net/npm/fuse.js@6.6.2/dist/fuse.esm.js";

// -------------------------------- Firebase stuff -------------------------------------

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    updateDoc,
    doc
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
// https://firebase.google.com/docs/web/setup#available-libraries


// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
apiKey: "AIzaSyAvTWKk-UGmyQExpXNVumEUz6qy8iaq05M",
authDomain: "recipes-to-groceries.firebaseapp.com",
projectId: "recipes-to-groceries",
storageBucket: "recipes-to-groceries.firebasestorage.app",
messagingSenderId: "751146544688",
appId: "1:751146544688:web:297c50e194038ddc3d07f5",
measurementId: "G-81T5VSM2KW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);


//-------------------------------- Initializes all the elements -----------------------

const $ = (id) => document.getElementById(id);

const navMenuBtn = $("navMenuBtn");
const navMenu = $("navMenu");
const groceryListBoxBtn = $("groceryListBoxBtn");
const groceryListBox = $("groceryListBox");
const addRecipesBoxBtn = $("addRecipesBoxBtn");
const addRecipesBox = $("addRecipesBox")
const accountBtn = $("accountBtn");
const loginOverlay = $("loginOverlay");
const searchBtn = $("searchBtn");
const addBtn = $("addBtn");
const recipeNameInput = $("recipeNameInput");
const ingredientsInput = $("ingredientsInput");
const instructionsInput = $("instructionsInput");
const searchInput = $("searchInput");
const output = $("output");
const recipeContainer = $("recipeContainer");
const groceryListContainer = $("groceryListContainer");
const addRecipeFromURLBtn = $("addRecipeFromURLBtn");
const addRecipeFromURLBox = $("addRecipeFromURLBox");
const addRecipeFromURLBoxText = $("addRecipeFromURLBoxText");
const tryURLBtn = $("tryURLBtn");
const addRecipeURL = $("addRecipeURL")

const backgroundOverlay = document.querySelectorAll(".backgroundOverlay");
const groceryList = [];


//------------------------- Sign up, sign out, log in ----------------------------------

const emailInput = $("emailInput");
const passwordInput = $("passwordInput");
const signupBtn = $("signupBtn");
const loginBtn = $("loginBtn");
const logoutBtn = $("logoutBtn");


signupBtn.addEventListener("click", signUp);
loginBtn.addEventListener("click", logIn);
logoutBtn.addEventListener("click", logOut);


async function signUp() {
    try {
        const userCredential =
            await createUserWithEmailAndPassword(
                auth,
                emailInput.value,
                passwordInput.value
            );

        console.log(userCredential.user);

        output.textContent = "Account created!";
    }
    catch (error) {
        if (error.message === "Firebase: Error (auth/invalid-email).") {
            output.textContent = "Invalid email address"
        }
        else {
            output.textContent = error.message;
        }
    }
    loginOverlay.classList.toggle("hidden");
}

async function logIn() {
    try {
        const userCredential =
            await signInWithEmailAndPassword(
                auth,
                emailInput.value,
                passwordInput.value
            );

        output.textContent = "Logged in!";
        loginOverlay.classList.toggle("hidden");
    }
    catch (error) {
        output.textContent = error.message;
    }
}

async function logOut() {
    await signOut(auth);

    output.textContent = "Logged out!";
    loginOverlay.classList.toggle("hidden");
}


//--------------------------------- Authorization --------------------------------------

let currentUser = null;
let userRecipes = []

onAuthStateChanged(auth, (user) => {
    currentUser = user;

    if (user) {
        console.log("Logged in as:", user.email);
        loadUserRecipes(user);
    } else {
        console.log("Logged out");
        userRecipes = [];
        displayRecipes();
    }
});



//------------------------------- Loading recipes ---------------------------------



//Path for all the user recipes
function userRecipesRef() {
    return collection(db, "users", currentUser.uid, "recipes");
}

//Loads the user recipes
async function loadUserRecipes() {
    if (!currentUser) return;

    const snapshot = await getDocs(userRecipesRef());

    userRecipes = [];

    snapshot.forEach(docSnap => {
        userRecipes.push({
            id: docSnap.id,
            ...docSnap.data()
        });
    });

    displayRecipes(getAllRecipes());
}

//Loads starting recipes
const starterRecipes = []
async function loadStarterRecipes() {
    const response = await fetch("starterRecipes.json");
    starterRecipes.push(...await response.json());
    displayRecipes(getAllRecipes())
}
loadStarterRecipes();


function getAllRecipes() {
    return [...userRecipes, ...starterRecipes];
}


function iHateAddingRecipesManually() {
    const jsonText = JSON.stringify(userRecipes, null, 2);
    console.log(jsonText)
}



//------------------------------------ Reading input clicks  ------------------------------------//


addBtn.addEventListener("click", addRecipe);
searchBtn.addEventListener("click", searchRecipe);
recipeContainer.addEventListener("click", recipeCardClicked);


//overlay handler
backgroundOverlay.forEach(overlay => {
    overlay.addEventListener("click", hideOverlay);
});

function hideOverlay(e) {
    if (e.target.classList.contains("backgroundOverlay")) {
        e.target.classList.add("hidden");
    }
}


//Connects toggle buttons up to their respective elements on the page
const toggles = [
    [accountBtn, loginOverlay],
    [navMenuBtn, navMenu],
    [groceryListBoxBtn, groceryListBox],
    [addRecipesBoxBtn, addRecipesBox],
    [addRecipeFromURLBtn, addRecipeFromURLBox]
]

//gives each button an event listener to hide stuff
toggles.forEach(([btn, element]) => {
    btn.addEventListener("click", () => element.classList.toggle("hidden"));
})



function recipeCardClicked(e) {
    const action = e.target.dataset.action;
    const id = e.target.dataset.id;

    if (action === "delete") {
        deleteRecipe(id);
    }
    if (action === "edit") {
        editRecipe(id);
    }
    if (action === "addToList") {
        addRecipeToList(id);
    }
    if (action == "toggle") {
        toggleDetails(id);
    }
}


//----------------------------- Search, edit, and delete Recipes ------------------------------------//
let editingId = null;

function editRecipe(id) {
    
    console.log("editing the thing")
    const recipe = userRecipes.find(r => r.id === id);

    recipeNameInput.value = recipe.name;
    instructionsInput.value = recipe.instructions;
    ingredientsInput.value = recipe.ingredients
        .map(i => `${i.amount} ${i.name}`)
        .join(", ");
    editingId = id;
    addBtn.textContent = "Save changes";
    addRecipesBox.classList.toggle("hidden"); 
}


async function deleteRecipe(id){
    console.log("deleted the thing")
    await deleteDoc(doc(db, "users", currentUser.uid, "recipes", id));
    userRecipes = userRecipes.filter(recipe => recipe.id !==id);
    displayRecipes();
}


//searching
function searchRecipe() {
    
    const fuse = new Fuse(getAllRecipes(), {
        keys: ["name"],
        threshold: 0.4
    });


    const query = searchInput.value.trim().toLowerCase();
    const matches = query? fuse.search(query).map(r => r.item) : getAllRecipes();

    displayRecipes(matches);
    iHateAddingRecipesManually();
}


//------------------------------------ Displaying Recipes ------------------------------------//
function displayRecipes(recipeList=getAllRecipes()) {
    recipeContainer.innerHTML = "";

    recipeList.forEach(recipe => {
        const recipeCard = document.createElement("div");
        recipeCard.classList.add("recipeCard");
        
        if (recipe.source==="starter") {
            recipeCard.style.backgroundColor = "rgb(63, 61, 133)";
            recipeCard.innerHTML = `
                <h3>${recipe.name}</h3>
                <button class="toggle-btn" data-action="toggle" data-id="${recipe.id}">Show/Hide details</button>
                <button class="addToList-btn" data-action="addToList" data-id="${recipe.id}">Add to List</button>
                
                <div class="details hidden" id="details-${recipe.id}">
                    <ul>
                        ${recipe.ingredients.map(i => `<li>${i.amount} ${i.name}</li>`).join("")}
                    </ul>
                    <p style="white-space: pre-line" >${recipe.instructions}</p>
                </div>
            `;
        }
        else{
            recipeCard.innerHTML = `
                <h3>${recipe.name}</h3>
                <button class="toggle-btn" data-action="toggle" data-id="${recipe.id}">Show/Hide details</button>
                <button class="addToList-btn" data-action="addToList" data-id="${recipe.id}">Add to List</button>
                
                <div class="details hidden" id="details-${recipe.id}">
                    <button class="delete-btn" data-action="delete" data-id="${recipe.id}">Delete</button>
                    <button class="edit-btn" data-action="edit" data-id="${recipe.id}">Edit</button>
                    
                    <ul>
                        ${recipe.ingredients.map(i => `<li>${i.amount} ${i.name}</li>`).join("")}
                    </ul>
                    <p style="white-space: pre-line" >${recipe.instructions}</p>
                </div>
            `;
        }
        recipeContainer.appendChild(recipeCard);
    });
}


function toggleDetails(id) {
    $(`details-${id}`).classList.toggle("hidden");
}

//------------------------------------ Adding Recipes ------------------------------------
async function addRecipe() {
    if (!currentUser) {
    output.textContent = "You must be logged in to add recipes";
    addRecipesBox.classList.toggle("hidden"); 
    return;
}
    if (recipeNameInput.value.trim() && ingredientsInput.value.trim() && instructionsInput.value.trim()) {
        const formattedName =
            recipeNameInput.value.trim().charAt(0).toUpperCase() +
            recipeNameInput.value.trim().slice(1);
        const formattedIngredients = 
            ingredientsInput.value.split(/,|;|\n+/)
            .map(item => {
                const parts = item.trim().split(/\s+/);
                return {
                    amount: Number(parts[0].trim()),
                    name: parts.slice(1).join(" ").toLowerCase()
                };
            });
        const formattedInstructions = instructionsInput.value.trim();
        
        if(editingId !== null) { //update recipe
            const index = userRecipes.findIndex(r => r.id === editingId);
            const updatedRecipe = {
                id: editingId,
                name: formattedName,
                ingredients: formattedIngredients,
                instructions: formattedInstructions,
                source: "user"
            };

            userRecipes[index] = updatedRecipe;

            const ref = doc(db, "users", currentUser.uid, "recipes", editingId);

            await updateDoc(ref, {
                name: formattedName,
                ingredients: formattedIngredients,
                instructions: formattedInstructions
            });

            output.textContent = `${formattedName} recipe successfully updated!`;
            editingId = null;
            addBtn.textContent = "Add recipe";
        }
        
        else { //create new recipe
           const recipe = {
                name: formattedName,
                ingredients: formattedIngredients,
                instructions: formattedInstructions,
                source: "user"
            };
            output.textContent = `${recipe.name} recipe successfully added!`;
            
            const docRef = await addDoc(userRecipesRef(currentUser), recipe);

            userRecipes.push({
                id: docRef.id,
                ...recipe
            });
            

        }

        displayRecipes();
    
        recipeNameInput.value = "";
        ingredientsInput.value = "";
        instructionsInput.value = "";
    }
    else {
        output.textContent = "Please put a recipe title, ingredient list, and instructions."
    }
    addRecipesBox.classList.toggle("hidden"); 
}


/*tryURLBtn.addEventListener("click", () => tryToAddRecipeFromURL(addRecipeURL.value));


async function importRecipeFromUrl (url) { //GPT helped with this
    const proxies = [
        "https://corsproxy.io/?",
        "https://api.allorigins.win/raw?url=",
        "https://r.jina.ai/http://"
    ]

    let html = null;

    for (let proxy of proxies) {
        try {
            const fullURL = proxy + encodeURIComponent(url);
            const res = await fetch(fullURL); //res = responce
            
            if (!res.ok) throw new Error("bad responce");

            html = await res.text();
            //break;
            console.log(`${proxy} worked!`)
        }
        catch (err) {
            console.log(`proxy failed: ${proxy}`, err);
        }
    }

    if (!html) { throw new Error("all proxies failed :(")}
    
    console.log(html)
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
    let recipe = null;

    scripts.forEach(script => {
        try {
            const data = JSON.parse(script.textContent);

            if (data["@type"] === "Recipe") {
                recipe = data;
            }

            if (Array.isArray(data)) {
                recipe = data.find(x => x["@type"] === "Recipe");
            }
        } catch (e) {}
    });

    if (!recipe) {
        return null;
    }

    return {
        name: recipe.name,
        ingredients: recipe.recipeIngredient || [],
        instructions: recipe.recipeInstructions
    };
}

async function tryToAddRecipeFromURL(url) {
    console.log("Trying url...")
    const recipe = await importRecipeFromUrl(url);

    if (recipe && recipe.name && recipe.ingredients) {
        recipeNameInput.value = recipe.name;
        ingredientsInput.value = recipe.ingredients.join(",");
        instructionsInput.value = recipe.instructions;
    }
    else {
        addRecipeFromURLBoxText.textContent = `Sorry, couldn't find recipe on the website "${url}". Make sure it is typed in correctly. You can also copy and paste from the website and format it below.`;
    }
    
}*/

//------------------------------------ Adding stuff to grocery list ------------------------------------//
function addRecipeToList(id) {
    const recipe = getAllRecipes().find(r => r.id === id); // Find the recipe

    groceryList.push(...recipe.ingredients);
    output.textContent = `Added ${recipe.name} to grocery list`;
    
    const combinedGroceryList = {};

    groceryList.forEach(item => { //adds up all the ingredients

        const normalizedName = normalizeIngredients(item.name)
        const match = findMatch(normalizedName, combinedGroceryList)


        if (combinedGroceryList[match]) {
            combinedGroceryList[match] += item.amount;
        }
        else {
            combinedGroceryList[normalizedName] = item.amount;
        }
    });

    groceryListContainer.innerHTML = Object.entries(combinedGroceryList)
        .map(([name, amount]) => `<li style="list-style-type: none"><input type="checkbox">${amount} ${name}</li>`).join("");

}

function normalizeIngredients(name) {
    return name
    .toLowerCase()
    .trim()
    .replace(/ies$/, "y")
    .replace(/ves$/, "f")
    .replace(/es$/, "")
    .replace(/s$/, "");
}

function findMatch(name, combinedList) {
    const fuse = new Fuse(Object.keys(combinedList), { //imported from Fuse
        threshold: 0.4,
        ignoreLocation: true
    });

    const result = fuse.search(name);
    return result.length>0? result[0].item : null; // "C ? A : B" means if C then A and if not C then B.
}