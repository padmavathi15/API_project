require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
console.log(process.env.SPOONACULAR_API_KEY);

app.get('/', (req, res) => {
  res.render('index', { content: null, error: null });
});
app.get('/search', async (req, res) => {
    const query = req.query.query;
  
    if (!query) {
      return res.render('index', { content: null, error: 'Please enter a search query.' });
    }
  
    try {
      const response = await axios.get(`https://api.spoonacular.com/recipes/complexSearch`, {
        params: {
          query: query,
          apiKey: process.env.SPOONACULAR_API_KEY,
          addRecipeInformation: true,
          number: 10
        }
      });
  
      console.log(response.data); // Log to check the structure of response.data
  
      const recipes = response.data.results && response.data.results.length > 0
        ? await Promise.all(response.data.results.map(async (recipe) => {
            // Ensure the recipe has all required fields
            const recipeDetails = recipe.id ? await axios.get(`https://api.spoonacular.com/recipes/${recipe.id}/information`, {
              params: {
                apiKey: process.env.SPOONACULAR_API_KEY
              }
            }) : null;
  
            return {
              title: recipe.title,
              image: recipe.image,
              ingredients: recipeDetails && recipeDetails.data.extendedIngredients
                ? recipeDetails.data.extendedIngredients.map(ingredient => ingredient.original)
                : ['Ingredients not available'],
              instructions: recipeDetails && recipeDetails.data.instructions
                ? recipeDetails.data.instructions
                : 'No instructions available'
            };
          }))
        : null;
  
      if (recipes) {
        res.render('index', { content: recipes, error: null });
      } else {
        res.render('index', { content: null, error: 'No recipes found.' });
      }
    } catch (error) {
      console.error('Error:', error.response ? error.response.data : error.message);
      res.render('index', { content: null, error: 'Error fetching recipes. Please try again later.' });
    }
  });
  

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
