console.log("congrats it loaded properly proyl");


const searchBtn = document.getElementById("searchBtn");
const addBtn = document.getElementById("addBtn");
const recipeNameInput = document.getElementById("recipeName");
const ingredientsInput = document.getElementById("ingredients");
const instructionsInput = document.getElementById("instructions");
const searchInput = document.getElementById("recipeSearch");
const output = document.getElementById("output");
const recipeContainer = document.getElementById("recipeContainer");
const groceryListContainer = document.getElementById("groceryListContainer");

let userRecipes = JSON.parse(localStorage.getItem("recipes")) || [];

//load starting recipes
const starterRecipes = []
async function loadStarterRecipes() {
    const response = await fetch("starterRecipes.json");
    starterRecipes.push(...await response.json());
    displayRecipes(getAllRecipes())
}
loadStarterRecipes();

function iHateAddingRecipesManually() {
    const jsonText = JSON.stringify(userRecipes, null, 2);
    console.log(jsonText)
}

function getAllRecipes() {
    return [...userRecipes, ...starterRecipes];
}


displayRecipes(getAllRecipes())

const groceryList = []


//------------------------------------ Reading input clicks  ------------------------------------//
addBtn.addEventListener("click", addRecipe);
searchBtn.addEventListener("click", searchRecipe);
recipeContainer.addEventListener("click", recipeCardClicked)


function recipeCardClicked(e) {
    const action = e.target.dataset.action;
    const id = Number(e.target.dataset.id);

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


//------------------------------------ Adding stuff to grocery list ------------------------------------//
function addRecipeToList(id) {
    const recipe = getAllRecipes().find(r => r.id === id); // Find the recipe

    groceryList.push(...recipe.ingredients);
    output.textContent = `Added ${recipe.name} to grocery list`;
    
    const combinedGroceryList = {};

    groceryList.forEach(item => { //adds up all the ingredients
        if (combinedGroceryList[item.name]) {
            combinedGroceryList[item.name] += item.amount;
        }
        else {
            combinedGroceryList[item.name] = item.amount;
        }
    });

    groceryListContainer.innerHTML = Object.entries(combinedGroceryList)
        .map(([name, amount]) => `<li style="list-style-type: none"><input type="checkbox">${amount} ${name}</li>`).join("");

}


//------------------------------------ Search, edit, and delete Recipes ------------------------------------//
let editingId = null;

function editRecipe(id) {
    const recipe = userRecipes.find(r => r.id === id);

    recipeNameInput.value = recipe.name;
    instructionsInput.value = recipe.instructions;
    ingredientsInput.value = recipe.ingredients
        .map(i => `${i.amount} ${i.name}`)
        .join(", ");
    editingId = id;
    addBtn.textContent = "Save changes";
}


function deleteRecipe(id){
    userRecipes = userRecipes.filter(recipe => recipe.id !==id);
    localStorage.setItem("recipes", JSON.stringify(userRecipes));
    displayRecipes();
}


function searchRecipe() {
    const recipesSearched = getAllRecipes().filter(recipe => 
        recipe.name.toLowerCase().includes(searchInput.value.toLowerCase()));
    displayRecipes(recipesSearched)
    iHateAddingRecipesManually(); //DELETE LATER ...................................
}


//------------------------------------ Displaying Recipes ------------------------------------//
function displayRecipes(recipeList=getAllRecipes()) {
    recipeContainer.innerHTML = "";

    recipeList.forEach(recipe => {
        const recipeCard = document.createElement("div");
        recipeCard.classList.add("recipeCard");
        
        if (recipe.id<10000) {
            recipeCard.innerHTML = `
                <h3>${recipe.name} (starter recipe)</h3>
                <button class="addToList-btn" data-action="addToList" data-id="${recipe.id}">Add to List</button>
                <ul>
                    ${recipe.ingredients.map(i => `<li>${i.amount} ${i.name}</li>`).join("")}
                </ul>
                <p>${recipe.instructions}</p>
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
                    <p>${recipe.instructions}</p>
                </div>
            `;
        }
        recipeContainer.appendChild(recipeCard);
    });
}


function toggleDetails(id) {
    document.getElementById(`details-${id}`).classList.toggle("hidden");
}

//------------------------------------ Adding Recipes ------------------------------------//
function addRecipe() {
    
    if (recipeNameInput.value.trim() && ingredientsInput.value.trim() && instructionsInput.value.trim()) {
        const formattedName =
            recipeNameInput.value.trim().charAt(0).toUpperCase() +
            recipeNameInput.value.trim().slice(1);
        const formattedIngredients = 
            ingredientsInput.value.split(",")
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
            userRecipes[index] = {
                id: editingId,
                name: formattedName,
                ingredients: formattedIngredients,
                instructions: formattedInstructions
            }
            output.textContent = `${formattedName} recipe successfully updated!`;
            editingId = null;
            addBtn.textContent = "Add recipe";
        }
        
        else { //create new recipe
           const recipe = {
                id: Date.now(),
                name: formattedName,
                ingredients: formattedIngredients,
                instructions: formattedInstructions
            };
            output.textContent = `${recipe.name} recipe successfully added!`;
            userRecipes.push(recipe);
        }

        localStorage.setItem("recipes", JSON.stringify(userRecipes));
        displayRecipes();
        console.log(getAllRecipes());
        recipeNameInput.value = "";
        ingredientsInput.value = "";
        instructionsInput.value = "";
    }
    else {
        output.textContent = "Please put both a recipe title, ingredient list, and instructions."
    }
        
}
