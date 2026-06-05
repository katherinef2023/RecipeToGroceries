console.log("congrats it loaded properly proyl");




const addBtn = document.getElementById("addBtn");
const recipeNameInput = document.getElementById("recipeName");
const ingredientsInput = document.getElementById("ingredients");
const output = document.getElementById("output");
const recipeContainer = document.getElementById("recipeContainer");
const groceryListContainer = document.getElementById("groceryListContainer");

let recipes = JSON.parse(localStorage.getItem("recipes")) || [];
displayRecipes()

let groceryList = []

addBtn.addEventListener("click", addRecipe);
recipeContainer.addEventListener("click", recipeCardClicked)
let editingId = null;


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
}


function addRecipeToList(id) {
    const recipe = recipes.find(r => r.id === id); // Find the recipe

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


function editRecipe(id) {
    const recipe = recipes.find(r => r.id === id)

    recipeNameInput.value = recipe.name
    ingredientsInput.value = recipe.ingredients
        .map(i => `${i.amount} ${i.name}`)
        .join(", ");
    editingId = id;
    addBtn.textContent = "Save changes";
}


function deleteRecipe(id){
    recipes = recipes.filter(recipe => recipe.id !==id);
    localStorage.setItem("recipes", JSON.stringify(recipes));
    displayRecipes();
}


function displayRecipes() {
    recipeContainer.innerHTML = "";

    recipes.forEach(recipe => {
        const recipeCard = document.createElement("div");
        recipeCard.classList.add("recipeCard");
        recipeCard.innerHTML = `
            <h3>${recipe.name}</h3>
            <button class="delete-btn" data-action="delete" data-id="${recipe.id}">Delete</button>
            <button class="edit-btn" data-action="edit" data-id="${recipe.id}">Edit</button>
            <button class="addToList-btn" data-action="addToList" data-id="${recipe.id}">Add to List</button>
            <ul>
                ${recipe.ingredients.map(i => `<li>${i.amount} ${i.name}</li>`).join("")}
            </ul>
        `;
        recipeContainer.appendChild(recipeCard);
    });
}


function addRecipe() {
    
    if (recipeNameInput.value.trim() && ingredientsInput.value.trim()) {
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

        if(editingId !== null) { //update recipe
            const index = recipes.findIndex(r => r.id === editingId);
            recipes[index] = {
                id: editingId,
                name: formattedName,
                ingredients: formattedIngredients
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
            };
            output.textContent = `${recipe.name} recipe successfully added!`;
            recipes.push(recipe);
        }

        output
        localStorage.setItem("recipes", JSON.stringify(recipes));
        displayRecipes();
        console.log(recipes);
        recipeNameInput.value = "";
        ingredientsInput.value = "";
    }
    else {
        output.textContent = "Please put both a recipe title and ingredient list."
    }
        
}
