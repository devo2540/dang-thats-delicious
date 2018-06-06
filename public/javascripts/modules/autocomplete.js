function autocomplete(input, latInput, lngInput) {
    if(!input) return; // skip this function if there is no input on page.

    const dropdown = new google.maps.places.Autocomplete(input); // get autocomple dropdown from google API

    dropdown.addListener('place_changed', () => {
        const place = dropdown.getPlace(); // get place from address input
        latInput.value = place.geometry.location.lat(); // populate lat, lng inputs from google API
        lngInput.value = place.geometry.location.lng();
    });
    // if user hits enter key on address field, don't submit the form.
    input.on('keydown', (e) => {
        if(e.keyCode === 13) e.preventDefault();
    });
}

export default autocomplete; 