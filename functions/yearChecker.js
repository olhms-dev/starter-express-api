const yearChecker = (eventDate) => {
    const year = Number.parseInt(eventDate.slice(-4));
    const current_year = new Date().getFullYear();

    return year === current_year;
}

module.exports = yearChecker;