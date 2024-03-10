function generateSearchRegex(search_string) {
    // Escape special characters in the search term
    const escapedSearchTerm = search_string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  
    // Create a case-insensitive regex for the search term
    const regex = new RegExp(escapedSearchTerm, 'i');
  
    return regex;
}

// // Example usage:
// const search_string = 'foodKart';
// const searchRegex = generateSearchRegex(search_string);

// // Test the regex against a string
// const testString = 'foodKart is a great business idea.';
// const isMatch = searchRegex.test(testString);

// console.log(isMatch); // Output: true

module.exports = {generateSearchRegex};