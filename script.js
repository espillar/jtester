document.addEventListener('DOMContentLoaded', () => {
    // --- DATA ---
    let allCards = {}; // Store all cards by ID for easy lookup
    let column1CardIds = []; // IDs of cards in column 1
    let nextCardId = 1;
    let selectedCol1CardId = null;
    let selectedCol2CardId = null;
    let selectedCol3CardId = null; // Added for column 3 selection
    let cachedCardStructure = null; // To store the copied card structure

    // --- DOM ELEMENTS ---
    const cardTextInput = document.getElementById('card-text-input');
    const addCardButton = document.getElementById('add-card-button');
    const column1El = document.getElementById('column-1');
    const column2El = document.getElementById('column-2');
    const column3El = document.getElementById('column-3');
    const deleteCardButton = document.getElementById('delete-card-button');
    const copyCardButton = document.getElementById('copy-card-button');
    const pasteCardButton = document.getElementById('paste-card-button');
    const saveBoardButton = document.getElementById('save-board-button');
    const loadBoardInput = document.getElementById('load-board-input');

    // --- FUNCTIONS ---

    function getCard(cardId) {
        return allCards[cardId];
    }

    function createCardObject(text) {
        const newId = nextCardId++;
        const card = {
            id: newId,
            text: text,
            children: []
        };
        allCards[newId] = card;
        return card;
    }

    function renderCards(columnElement, cardIdsToRender) {
        const h2 = columnElement.querySelector('h2');
        columnElement.innerHTML = '';
        if (h2) columnElement.appendChild(h2);

        cardIdsToRender.forEach(id => {
            const card = getCard(id);
            if (!card) return;

            const cardDiv = document.createElement('div');
            cardDiv.classList.add('card');
            cardDiv.textContent = card.text;
            cardDiv.dataset.cardId = card.id;

            let columnNumber;
            if (columnElement === column1El) columnNumber = 1;
            else if (columnElement === column2El) columnNumber = 2;
            else if (columnElement === column3El) columnNumber = 3;

           // Allow selection in all columns for now, actions will be context-dependent
           if (columnNumber) { // Simplified: if it's a column we know, allow selection click
               cardDiv.addEventListener('click', () => handleCardSelection(card.id, columnNumber));
           }

            // Highlight selected card
            if ((columnNumber === 1 && card.id === selectedCol1CardId) ||
                (columnNumber === 2 && card.id === selectedCol2CardId) ||
                (columnNumber === 3 && card.id === selectedCol3CardId)) {
                cardDiv.classList.add('selected');
            }

            columnElement.appendChild(cardDiv);
        });
    }

    function handleCardSelection(cardId, columnNumber) {
        if (columnNumber === 1) {
            if (selectedCol1CardId === cardId) { // Deselecting
                selectedCol1CardId = null;
                selectedCol2CardId = null;
                selectedCol3CardId = null; // Clear all subsequent selections
                clearAndRenderColumn(column2El, []);
                clearAndRenderColumn(column3El, []);
            } else {
                selectedCol1CardId = cardId;
                selectedCol2CardId = null; // Clear subsequent selections
                selectedCol3CardId = null;
                const parentCard = getCard(cardId);
                clearAndRenderColumn(column2El, parentCard ? parentCard.children : []);
                clearAndRenderColumn(column3El, []);
            }
            renderCards(column1El, column1CardIds); // Re-render col1 for selection styles
            // Col2 and Col3 are cleared and re-rendered by clearAndRenderColumn

        } else if (columnNumber === 2) {
            if (selectedCol2CardId === cardId) { // Deselecting
                selectedCol2CardId = null;
                selectedCol3CardId = null; // Clear subsequent selections
                clearAndRenderColumn(column3El, []);
            } else {
                selectedCol2CardId = cardId;
                selectedCol3CardId = null; // Clear subsequent selections
                const parentCard = getCard(cardId);
                clearAndRenderColumn(column3El, parentCard ? parentCard.children : []);
            }
            // Re-render column 2 to update its own selection styles
            if (selectedCol1CardId) {
                const col1ParentCard = getCard(selectedCol1CardId);
                renderCards(column2El, col1ParentCard ? col1ParentCard.children : []);
            } else {
                renderCards(column2El, []); // Should not happen if Col2 card is selected
            }
            // Col3 is cleared/re-rendered by clearAndRenderColumn

        } else if (columnNumber === 3) {
            if (selectedCol3CardId === cardId) { // Deselecting
                selectedCol3CardId = null;
            } else {
                selectedCol3CardId = cardId;
                // No further columns to populate from Col 3 selection
            }
            // Re-render column 3 to update its own selection styles
            if (selectedCol2CardId) {
                const col2ParentCard = getCard(selectedCol2CardId);
                renderCards(column3El, col2ParentCard ? col2ParentCard.children : []);
            } else {
                renderCards(column3El, []); // Should not happen if Col3 card is selected
            }
        }
    }

    function clearAndRenderColumn(columnEl, cardIds) {
        const h2 = columnEl.querySelector('h2');
        columnEl.innerHTML = '';
        if (h2) columnEl.appendChild(h2);
        renderCards(columnEl, cardIds);
    }

    function handleAddCard() {
        const text = cardTextInput.value.trim();
        if (!text) {
            alert("Card text cannot be empty!");
            return;
        }

        const newCard = createCardObject(text);

        if (selectedCol2CardId !== null) {
            const parentCard = getCard(selectedCol2CardId);
            if (parentCard) {
                parentCard.children.push(newCard.id);
                renderCards(column3El, parentCard.children);
            }
        } else if (selectedCol1CardId !== null) {
            const parentCard = getCard(selectedCol1CardId);
            if (parentCard) {
                parentCard.children.push(newCard.id);
                renderCards(column2El, parentCard.children);
            }
        } else {
            column1CardIds.push(newCard.id);
            renderCards(column1El, column1CardIds);
        }
        cardTextInput.value = '';
    }

    // --- EVENT LISTENERS ---
    addCardButton.addEventListener('click', handleAddCard);
    cardTextInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            handleAddCard();
        }
    });
    deleteCardButton.addEventListener('click', handleDeleteSelected);
    copyCardButton.addEventListener('click', handleCopySelected);
    pasteCardButton.addEventListener('click', handlePasteCachedCard);
    saveBoardButton.addEventListener('click', handleSaveBoard);
    loadBoardInput.addEventListener('change', handleLoadBoard);

    // --- INITIALIZATION ---
    renderCards(column1El, column1CardIds);
    renderCards(column2El, []);
    renderCards(column3El, []);


    /**
     * Recursively removes a card and all its children from the allCards data structure.
     * @param {number} cardId - The ID of the card to delete.
     */
    function deleteCardDataRecursive(cardId) {
        const card = getCard(cardId);
        if (!card) {
            return;
        }

        // Recursively delete children
        if (card.children && card.children.length > 0) {
            // Iterate over a copy of children array for safe modification
            [...card.children].forEach(childId => {
                deleteCardDataRecursive(childId);
                // The child's removal from parent's children array will be handled
                // by the caller of the top-level delete, or implicitly if parent is deleted.
            });
        }

        // Remove the card itself from the global store
        delete allCards[cardId];
    }

    /**
     * Removes a cardId from a given parent's children array.
     * @param {number} parentCardId - The ID of the parent card.
     * @param {number} cardIdToRemove - The ID of the card to remove from children.
     */
    function removeChildFromParent(parentCardId, cardIdToRemove) {
        const parentCard = getCard(parentCardId);
        if (parentCard && parentCard.children) {
            const index = parentCard.children.indexOf(cardIdToRemove);
            if (index > -1) {
                parentCard.children.splice(index, 1);
            }
        }
    }


    /**
    * Creates a deep copy of a card and its direct children's basic information (text).
    * This is a simplified version; a full recursive deep copy would be more complex.
    * @param {number} cardId - The ID of the card to copy.
    * @returns {object | null} A simplified structure of the copied card or null if not found.
    */
function copyCardStructure(cardId) {
    console.log('[CopyDebug] Attempting to copy structure for card ID:', cardId);
    const originalCard = getCard(cardId);

    if (!originalCard) {
        console.error('[CopyDebug] Original card not found for ID:', cardId);
        return null;
    }
    console.log('[CopyDebug] Original card data:', JSON.parse(JSON.stringify(originalCard))); // Deep copy for logging

    // Create a copy of the main card's text
    const copiedStructure = {
        text: originalCard.text, // Make sure originalCard.text is valid
        children: []
    };
    console.log('[CopyDebug] Copied main card text:', originalCard.text);

    // Copy direct children's text
    if (originalCard.children && originalCard.children.length > 0) {
        console.log('[CopyDebug] Original card has children IDs:', originalCard.children); // Keep log
        originalCard.children.forEach(childId => {
            const childCard = getCard(childId);
            if (childCard) {
                // CRITICAL LINE FOR THE FIX: Ensure this line creates an OBJECT with a 'text' property
                copiedStructure.children.push({ text: childCard.text });
                console.log('[CopyDebug] Processing child ID:', childId, 'Text:', childCard.text, 'Pushed to copiedStructure.children'); // Keep log
            } else {
                console.warn('[CopyDebug] Child card not found for ID:', childId); // Keep log
            }
        });
    } else {
        console.log('[CopyDebug] Original card has no children.'); // Keep log
    }
    console.log('[CopyDebug] Final copiedStructure (before return):', JSON.parse(JSON.stringify(copiedStructure)));
    return copiedStructure;
}

    /**
    * Handles the "Copy Selected" button click.
    */
    function handleCopySelected() {
    console.log('[CopyDebug] handleCopySelected called.');
    let cardIdToCopy = null;
    if (selectedCol3CardId !== null) {
        cardIdToCopy = selectedCol3CardId;
        console.log('[CopyDebug] Selected card for copy is from Column 3, ID:', cardIdToCopy);
    } else if (selectedCol2CardId !== null) {
        cardIdToCopy = selectedCol2CardId;
        console.log('[CopyDebug] Selected card for copy is from Column 2, ID:', cardIdToCopy);
    } else if (selectedCol1CardId !== null) {
        cardIdToCopy = selectedCol1CardId;
        console.log('[CopyDebug] Selected card for copy is from Column 1, ID:', cardIdToCopy);
    } else {
        alert("No card selected to copy.");
        console.log('[CopyDebug] No card selected to copy.');
        return;
    }

    if (cardIdToCopy !== null) {
        cachedCardStructure = copyCardStructure(cardIdToCopy); // This calls the instrumented function
        if (cachedCardStructure) {
            console.log('[CopyDebug] Card structure COPIED to global cachedCardStructure:', JSON.parse(JSON.stringify(cachedCardStructure)));
            alert("Selected card copied! (Check console for details)");
        } else {
            alert("Failed to copy card structure.");
            console.error('[CopyDebug] Failed to copy card structure, cachedCardStructure is null.');
        }
    }
}

    /**
     * Handles the "Delete Selected" button click.
     */
    function handleDeleteSelected() {
        let cardIdToDelete = null;
        let parentOfDeletedCardId = null;
        let deletedFromColumnNumber = 0;

        // Prioritize deletion from the furthest column with a selection
        if (selectedCol3CardId !== null) {
            cardIdToDelete = selectedCol3CardId;
            parentOfDeletedCardId = selectedCol2CardId; // Parent is in Col 2
            deletedFromColumnNumber = 3;
            if (selectedCol2CardId) { // Ensure parent exists before trying to remove child
                removeChildFromParent(selectedCol2CardId, cardIdToDelete);
            }
        } else if (selectedCol2CardId !== null) {
            cardIdToDelete = selectedCol2CardId;
            parentOfDeletedCardId = selectedCol1CardId; // Parent is in Col 1
            deletedFromColumnNumber = 2;
            if (selectedCol1CardId) { // Ensure parent exists
                removeChildFromParent(selectedCol1CardId, cardIdToDelete);
            }
        } else if (selectedCol1CardId !== null) {
            cardIdToDelete = selectedCol1CardId;
            // No explicit parent in allCards data structure for Col1 cards
            deletedFromColumnNumber = 1;
            const index = column1CardIds.indexOf(cardIdToDelete);
            if (index > -1) {
                column1CardIds.splice(index, 1);
            }
        } else {
            alert("No card selected to delete.");
            return;
        }

        if (cardIdToDelete !== null) {
            deleteCardDataRecursive(cardIdToDelete); // This recursively deletes from allCards

            // Clear selections and re-render
            if (deletedFromColumnNumber === 1) {
                selectedCol1CardId = null;
                selectedCol2CardId = null;
                selectedCol3CardId = null;
                renderCards(column1El, column1CardIds);
                clearAndRenderColumn(column2El, []); // Clear and render to remove old content
                clearAndRenderColumn(column3El, []);
            } else if (deletedFromColumnNumber === 2) {
                selectedCol2CardId = null;
                selectedCol3CardId = null;
                const parentCard = getCard(parentOfDeletedCardId); // parentOfDeletedCardId is selectedCol1CardId
                renderCards(column2El, parentCard ? parentCard.children : []);
                clearAndRenderColumn(column3El, []);
            } else if (deletedFromColumnNumber === 3) {
                selectedCol3CardId = null;
                const parentCard = getCard(parentOfDeletedCardId); // parentOfDeletedCardId is selectedCol2CardId
                renderCards(column3El, parentCard ? parentCard.children : []);
            }
        }
    }


    /**
    * Handles the "Paste Cached Card" button click.
    */
function handlePasteCachedCard() {
    console.log('[PasteDebug] handlePasteCachedCard called.');
    if (!cachedCardStructure) {
        alert("Nothing to paste. Copy a card first.");
        console.log('[PasteDebug] cachedCardStructure is null or empty. Aborting paste.');
        return;
    }

    console.log('[PasteDebug] Using cachedCardStructure:', JSON.parse(JSON.stringify(cachedCardStructure)));

    // Create the main new card object from the cached text
    console.log('[PasteDebug] Text for main new card from cache:', cachedCardStructure.text);
    const newMainCard = createCardObject(cachedCardStructure.text); // createCardObject adds to allCards and returns the card object
    if (!newMainCard || !newMainCard.id) {
        console.error('[PasteDebug] Failed to create newMainCard or it has no ID. Aborting.');
        return;
    }
    console.log('[PasteDebug] Created newMainCard ID:', newMainCard.id, 'Text:', newMainCard.text);


    // Paste its cached children as actual children of this newMainCard in the data model
    if (cachedCardStructure.children && cachedCardStructure.children.length > 0) {
        console.log('[PasteDebug] cachedCardStructure has children. Processing them.'); // Keep log
        cachedCardStructure.children.forEach((childTextObj, index) => {
            console.log(`[PasteDebug] Processing cached child #${index + 1}. Object from cache:`, JSON.parse(JSON.stringify(childTextObj))); // Log the whole object
            if (typeof childTextObj.text === 'undefined') {
                 console.warn(`[PasteDebug] childTextObj.text IS UNDEFINED for child #${index + 1}.`);
            }
            // CRITICAL LINE FOR THE FIX: Ensure this line correctly reads 'childTextObj.text'
            const newChildCard = createCardObject(childTextObj.text);
            // ... rest of child processing logic ...
            if (!newChildCard || !newChildCard.id) {
                console.error(`[PasteDebug] Failed to create newChildCard for cached child #${index + 1} or it has no ID.`);
                return;
            }
            newMainCard.children.push(newChildCard.id);
            console.log(`[PasteDebug] Created newChildCard ID: ${newChildCard.id}, Text: ${newChildCard.text}. Added to newMainCard's children.`); // Keep log
        });
    } else {
        console.log('[PasteDebug] cachedCardStructure has no children.'); // Keep log
    }

    console.log('[PasteDebug] newMainCard after processing children:', JSON.parse(JSON.stringify(newMainCard)));

    let targetColumnElement = null;
    let parentForPastedCard = null; // For logging

    // Determine where to paste (as sibling)
    if (selectedCol3CardId !== null) {
        console.log('[PasteDebug] Mode: Paste after selected card in Column 3. Selected ID:', selectedCol3CardId);
        parentForPastedCard = selectedCol2CardId ? getCard(selectedCol2CardId) : null;
        if (parentForPastedCard && parentForPastedCard.children) {
            const selectedIndex = parentForPastedCard.children.indexOf(selectedCol3CardId);
            console.log(`[PasteDebug] Parent for Col3 paste is Col2 card ID: ${selectedCol2CardId}. Selected index in parent's children: ${selectedIndex}`);
            if (selectedIndex > -1) {
                parentForPastedCard.children.splice(selectedIndex + 1, 0, newMainCard.id);
            } else {
                console.warn('[PasteDebug] Selected Col3 card not found in parent Col2 card children. Appending to end.');
                parentForPastedCard.children.push(newMainCard.id);
            }
            targetColumnElement = column3El;
            renderCards(targetColumnElement, parentForPastedCard.children);
        } else {
            alert("Error: Parent for Column 3 card not found or invalid. Pasting might be incomplete.");
            console.error('[PasteDebug] Parent for Column 3 card (Col2 ID:', selectedCol2CardId, ') not found or has no children array.');
            return;
        }
    } else if (selectedCol2CardId !== null) {
        console.log('[PasteDebug] Mode: Paste after selected card in Column 2. Selected ID:', selectedCol2CardId);
        parentForPastedCard = selectedCol1CardId ? getCard(selectedCol1CardId) : null;
        if (parentForPastedCard && parentForPastedCard.children) {
            const selectedIndex = parentForPastedCard.children.indexOf(selectedCol2CardId);
            console.log(`[PasteDebug] Parent for Col2 paste is Col1 card ID: ${selectedCol1CardId}. Selected index in parent's children: ${selectedIndex}`);
            if (selectedIndex > -1) {
                parentForPastedCard.children.splice(selectedIndex + 1, 0, newMainCard.id);
            } else {
                console.warn('[PasteDebug] Selected Col2 card not found in parent Col1 card children. Appending to end.');
                parentForPastedCard.children.push(newMainCard.id);
            }
            targetColumnElement = column2El;
            renderCards(targetColumnElement, parentForPastedCard.children);
        } else {
             alert("Error: Parent for Column 2 card not found or invalid. Pasting might be incomplete.");
             console.error('[PasteDebug] Parent for Column 2 card (Col1 ID:', selectedCol1CardId, ') not found or has no children array.');
            return;
        }
    } else if (selectedCol1CardId !== null) {
        console.log('[PasteDebug] Mode: Paste after selected card in Column 1. Selected ID:', selectedCol1CardId);
        const selectedIndex = column1CardIds.indexOf(selectedCol1CardId);
        console.log(`[PasteDebug] Target is Column 1. Selected index in column1CardIds: ${selectedIndex}`);
        if (selectedIndex > -1) {
            column1CardIds.splice(selectedIndex + 1, 0, newMainCard.id);
        } else {
            console.warn('[PasteDebug] Selected Col1 card not found in column1CardIds. Appending to end.');
            column1CardIds.push(newMainCard.id);
        }
        targetColumnElement = column1El;
        renderCards(targetColumnElement, column1CardIds);
    } else {
        console.log('[PasteDebug] Mode: No card selected, paste as the last card in Column 1.');
        column1CardIds.push(newMainCard.id);
        targetColumnElement = column1El;
        renderCards(targetColumnElement, column1CardIds);
    }
    console.log('[PasteDebug] Paste operation complete. newMainCard ID:', newMainCard.id, 'pasted.');
}


/**
* Handles the "Save Board" button click.
* Gathers current board state and triggers a JSON file download.
*/
function handleSaveBoard() {
    console.log('[SaveLoadDebug] handleSaveBoard called.');
    try {
        const boardState = {
            allCardsData: allCards, // The main object storing all card details
            rootCardIds: column1CardIds, // Array of IDs for cards in the first column
            nextIdToUse: nextCardId // Store the next ID to maintain continuity
        };

        const jsonString = JSON.stringify(boardState, null, 2); // null, 2 for pretty printing

        // Create a blob from the JSON string
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        // Create a temporary anchor element to trigger download
        const a = document.createElement('a');
        a.href = url;
        a.download = 'hierarchical-board.json'; // Suggested filename
        document.body.appendChild(a); // Append to body to make it clickable
        a.click();

        // Clean up: remove anchor and revoke object URL
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log('[SaveLoadDebug] Board saved successfully.');
        // alert("Board saved successfully!"); // Optional user feedback

    } catch (error) {
        console.error('[SaveLoadDebug] Error saving board:', error);
        alert("Error saving board. See console for details.");
    }
}


/**
* Clears all current board data and resets selections.
*/
function clearBoardForLoad() {
    allCards = {};
    column1CardIds = [];
    selectedCol1CardId = null;
    selectedCol2CardId = null;
    selectedCol3CardId = null;
    cachedCardStructure = null; // Clear any copied card data
    // nextCardId will be set by the loaded data or determined after load.

    // Clear visual columns
    column1El.innerHTML = '<h2>Column 1</h2>'; // Or use clearAndRenderColumn if titles are dynamic
    column2El.innerHTML = '<h2>Column 2</h2>';
    column3El.innerHTML = '<h2>Column 3</h2>';
    console.log('[SaveLoadDebug] Board cleared for loading new data.');
}

/**
* Determines the next card ID to use based on loaded data.
* Iterates all card IDs in allCardsData and finds the maximum.
* @param {object} allCardsData - The object containing all loaded card data.
* @returns {number} The next ID to use (max existing ID + 1, or 1 if no cards).
*/
function determineNextIdFromData(allCardsData) {
    let maxId = 0;
    if (allCardsData && typeof allCardsData === 'object') { // Check if allCardsData is valid
        for (const cardIdStr in allCardsData) {
            if (Object.prototype.hasOwnProperty.call(allCardsData, cardIdStr)) {
                const cardId = parseInt(cardIdStr, 10);
                if (!isNaN(cardId) && cardId > maxId) {
                    maxId = cardId;
                }
            }
        }
    }
    return maxId + 1;
}


/**
* Handles the file selection for loading a board.
* @param {Event} event - The file input change event.
*/
function handleLoadBoard(event) {
    console.log('[SaveLoadDebug] handleLoadBoard called.');
    const file = event.target.files[0];
    if (!file) {
        console.log('[SaveLoadDebug] No file selected.');
        return;
    }

    if (file.type !== "application/json") {
        alert("Invalid file type. Please select a JSON file.");
        console.warn('[SaveLoadDebug] Invalid file type:', file.type);
        event.target.value = null; // Reset file input
        return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
        try {
            const jsonString = e.target.result;
            console.log('[SaveLoadDebug] File content read.');
            const parsedState = JSON.parse(jsonString);
            console.log('[SaveLoadDebug] JSON parsed successfully.');

            // Basic validation of the loaded data structure
            if (!parsedState || typeof parsedState.allCardsData !== 'object' ||
                !Array.isArray(parsedState.rootCardIds) ||
                typeof parsedState.nextIdToUse !== 'number') {
                alert("Invalid board file format.");
                console.error('[SaveLoadDebug] Invalid board file format after parsing:', parsedState);
                event.target.value = null; // Reset file input
                return;
            }

            clearBoardForLoad(); // Clear existing board

            // Restore board state
            allCards = parsedState.allCardsData;
            column1CardIds = parsedState.rootCardIds;

            // Robustly set nextCardId
            if (typeof parsedState.nextIdToUse === 'number' && parsedState.nextIdToUse > 0) {
                nextCardId = parsedState.nextIdToUse;
            } else {
                console.warn('[SaveLoadDebug] nextIdToUse not found or invalid in JSON. Calculating from loaded cards.');
                nextCardId = determineNextIdFromData(allCards); // Use allCards here as it's now populated
            }

            console.log('[SaveLoadDebug] Board state restored from file.');
            console.log('[SaveLoadDebug] Restored allCards count:', Object.keys(allCards).length);
            console.log('[SaveLoadDebug] Restored column1CardIds:', column1CardIds);
            console.log('[SaveLoadDebug] Restored nextCardId:', nextCardId);


            // Re-render the board
            renderCards(column1El, column1CardIds);
            // Ensure other columns are also cleared properly (clearAndRenderColumn does this with titles)
            clearAndRenderColumn(column2El, []);
            clearAndRenderColumn(column3El, []);

            alert("Board loaded successfully!");
            console.log('[SaveLoadDebug] Board re-rendered.');

        } catch (error) {
            console.error('[SaveLoadDebug] Error processing loaded file:', error);
            alert("Error loading board file. It might be corrupted or not a valid board JSON. See console for details.");
        } finally {
             event.target.value = null; // Reset file input so user can load same file again if needed
        }
    };

    reader.onerror = (e) => {
        console.error('[SaveLoadDebug] FileReader error:', e);
        alert("Error reading file.");
        event.target.value = null; // Reset file input
    };

    reader.readAsText(file); // Read the file
}
});
