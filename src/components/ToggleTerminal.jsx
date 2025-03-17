import React from 'react';

const ToggleTerminal = () => {
    const handleToggle = () => {
        const terminal = document.querySelector('.terminal-container');
        terminal.classList.toggle('terminal-open');
    };

    return (
        <button
            className="terminal-toggle"
            onClick={handleToggle}
            aria-label="Toggle Terminal"
        >
            Terminal <span className="shortcut">(Ctrl+`)</span>
        </button>
    );
};

export default ToggleTerminal;