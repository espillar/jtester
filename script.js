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
        const originalCard = getCard(cardId);
        if (!originalCard) {
            return null;
        }

        // Create a copy of the main card's text
        const copiedStructure = {
            text: originalCard.text,
            children: [] // We'll store simplified children here
        };

        // Copy direct children's text
        if (originalCard.children && originalCard.children.length > 0) {
            originalCard.children.forEach(childId => {
                const childCard = getCard(childId);
                if (childCard) {
                    copiedStructure.children.push({ text: childCard.text });
                    // Note: We are not copying grandchildren or their structure here.
                    // This simplifies the paste operation significantly.
                    // To copy the full subtree, this function and pasting would need to be recursive.
                }
            });
        }
        return copiedStructure;
    }

    /**
    * Handles the "Copy Selected" button click.
    */
    function handleCopySelected() {
        let cardIdToCopy = null;
        if (selectedCol2CardId !== null) {
            cardIdToCopy = selectedCol2CardId;
        } else if (selectedCol1CardId !== null) {
            cardIdToCopy = selectedCol1CardId;
        } else {
            alert("No card selected to copy.");
            return;
        }

        if (cardIdToCopy !== null) {
            cachedCardStructure = copyCardStructure(cardIdToCopy);
            if (cachedCardStructure) {
                // Simple feedback; could be a more visible UI element
                console.log("Card structure copied to cache:", cachedCardStructure);
                alert("Selected card copied!");
            } else {
                alert("Failed to copy card structure.");
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
    if (!cachedCardStructure) {
        alert("Nothing to paste. Copy a card first.");
        return;
    }

    // Create the main new card object from the cached text
    const newMainCard = createCardObject(cachedCardStructure.text); // Adds to allCards, returns the card object

    // Paste its cached children as actual children of this newMainCard in the data model
    // These children will appear in the next column when newMainCard is selected.
    if (cachedCardStructure.children && cachedCardStructure.children.length > 0) {
        cachedCardStructure.children.forEach(childTextObj => {
            const newChildCard = createCardObject(childTextObj.text); // Creates child, adds to allCards
            newMainCard.children.push(newChildCard.id); // newMainCard now has these as children
        });
    }

    let targetColumnElement = null; // To know which column to re-render

    // Determine where to paste (as sibling)
    if (selectedCol3CardId !== null) { // Paste after selected card in Column 3
        const parentCol2Card = getCard(selectedCol2CardId);
        if (parentCol2Card && parentCol2Card.children) {
            const selectedIndex = parentCol2Card.children.indexOf(selectedCol3CardId);
            if (selectedIndex > -1) {
                parentCol2Card.children.splice(selectedIndex + 1, 0, newMainCard.id);
            } else { // Should not happen if selectedCol3CardId is valid child
                parentCol2Card.children.push(newMainCard.id);
            }
            targetColumnElement = column3El;
            renderCards(targetColumnElement, parentCol2Card.children);
        } else { // No valid parent for Col3 selected card (e.g. parent just deleted) - add to end of Col2 parent's children list or handle error
            alert("Error: Parent for Column 3 card not found. Pasting might be incomplete.");
            // Fallback or error: for safety, maybe try to add to end of column 2 if selectedCol2CardId exists
            if(selectedCol2CardId) {
                 const fallbackParent = getCard(selectedCol2CardId);
                 if(fallbackParent) {
                    fallbackParent.children.push(newMainCard.id);
                    renderCards(column3El, fallbackParent.children);
                 }
            }
            return;
        }
    } else if (selectedCol2CardId !== null) { // Paste after selected card in Column 2
        const parentCol1Card = getCard(selectedCol1CardId);
        if (parentCol1Card && parentCol1Card.children) {
            const selectedIndex = parentCol1Card.children.indexOf(selectedCol2CardId);
            if (selectedIndex > -1) {
                parentCol1Card.children.splice(selectedIndex + 1, 0, newMainCard.id);
            } else {
                parentCol1Card.children.push(newMainCard.id);
            }
            targetColumnElement = column2El;
            renderCards(targetColumnElement, parentCol1Card.children);
        } else {
             alert("Error: Parent for Column 2 card not found. Pasting might be incomplete.");
             if(selectedCol1CardId) {
                 const fallbackParent = getCard(selectedCol1CardId);
                 if(fallbackParent) {
                    fallbackParent.children.push(newMainCard.id);
                    renderCards(column2El, fallbackParent.children);
                 }
             }
            return;
        }
    } else if (selectedCol1CardId !== null) { // Paste after selected card in Column 1
        const selectedIndex = column1CardIds.indexOf(selectedCol1CardId);
        if (selectedIndex > -1) {
            column1CardIds.splice(selectedIndex + 1, 0, newMainCard.id);
        } else {
            column1CardIds.push(newMainCard.id); // Fallback if ID not found (should not happen)
        }
        targetColumnElement = column1El;
        renderCards(targetColumnElement, column1CardIds);
    } else { // No card selected, paste as the last card in Column 1
        column1CardIds.push(newMainCard.id);
        targetColumnElement = column1El;
        renderCards(targetColumnElement, column1CardIds);
    }
    // Optional: Clear cache? For now, allow multiple pastes.
    // cachedCardStructure = null;
    // alert("Card pasted!");
}
});
