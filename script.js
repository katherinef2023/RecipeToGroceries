console.log("initializizer, delete this later maybe idk");

let recipes = [];

addBtn.addEventListener("click", addRecipe);

function addRecipe() {
    const recipeNameInput = document.getElementById("recipeName");
    const ingredientsInput = document.getElementById("ingredients");
    const output = document.getElementById("output");
    
    if (recipeNameInput.value && ingredientsInput.value) {
        const recipe = {
            name: recipeNameInput.value,
            ingredients: ingredientsInput.value.split(","),
        };

        
        output.textContent = recipeNameInput.value + " recipe successfully added!";
        recipes.push(recipe);
        console.log(recipes);
        recipeNameInput.value = "";
        ingredientsInput.value = "";
    }
    else{
        output.textContent = "Please put both a recipe title and ingredient list."
    }
        
}