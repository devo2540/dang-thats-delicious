import axios from 'axios';
import dompurify from 'dompurify';

function searchResultsHTML(stores) {
    return stores.map(store => {
        return `
            <a href="/store/${store.slug}" class="search__result">
                <strong> ${store.name} </strong>
            </a>
        `
    }).join('');
};

function typeAhead(search) {
    if (!search) return;    // if search not on page, don't run.

    const searchInput = search.querySelector('input[name="search"]');
    const searchResults = search.querySelector('.search__results');

    searchInput.on('input', function () {
        // if no value, quit. 
        if (!this.value) {
            searchResults.style.display = 'none';   // hide it 
            return; // stop!
        }
        // show search results 
        searchResults.style.display = 'block';
        // searchResults.innerHTML = '';   // hide display if user backspaces

        // use axios to hit our endpoint
        axios
            .get(`/api/search?q=${this.value}`)
            .then(res => {
                if (res.data.length) {
                    searchResults.innerHTML = dompurify.sanitize(searchResultsHTML(res.data));  // display search results
                    return;
                }
                // or tell user nothing came back
                searchResults.innerHTML = dompurify.sanitize(`
                    <div class="search__result"> No results for <strong> ${this.value} </strong> found! </div>
                `);
            })
            .catch(err => {
                console.error(err);
            });
    });
    // handle keyboard inputs in search
    searchInput.on('keyup', (e) => {
        // if user isnt pressing up, down, or enter, skip this.
        if (![38, 40, 13].includes(e.keyCode)) {
            return;
        }
        const activeClass = 'search__result--active';
        const current = search.querySelector(`.${activeClass}`);
        const items = search.querySelectorAll('.search__result');
        let next;

        if (e.keyCode === 40 && current) {
            next = current.nextElementSibling || items[0];
        } else if (e.keyCode === 40) {
            next = items[0];
        } else if (e.keyCode === 38 && current) {
            next = current.previousElementSibling || items[items.length - 1];
        } else if (e.keyCode === 38) {
            next = items[items.length - 1];
        } else if (e.keyCode === 13 && current.href) {
            window.location = current.href;
            return;
        }
        if (current) {
            current.classList.remove(activeClass);
        }
        next.classList.add(activeClass);
    });
};

export default typeAhead;