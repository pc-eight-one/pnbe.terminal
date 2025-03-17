import React, { useState, useEffect, useRef } from 'react';
import '../styles/terminal.css';
import { executeCommand, getCommandHistory, addToCommandHistory } from '../utils/terminal-commands';

const Terminal = () => {
    const [commandHistory, setCommandHistory] = useState([]);
    const [currentCommand, setCurrentCommand] = useState('');
    const [prompt, setPrompt] = useState('guest@terminal:~$ ');
    const [historyIndex, setHistoryIndex] = useState(-1);
    const inputRef = useRef(null);
    const terminalRef = useRef(null);

    // Load previous commands on component mount
    useEffect(() => {
        const storedHistory = getCommandHistory();
        setCommandHistory(storedHistory);
    }, []);

    // Auto-scroll terminal when new content is added
    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [commandHistory]);

    // Focus the input when terminal is opened
    useEffect(() => {
        const handleFocus = () => {
            if (document.querySelector('.terminal-container').classList.contains('terminal-open')) {
                inputRef.current?.focus();
            }
        };

        window.addEventListener('click', handleFocus);
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === '`') {
                setTimeout(handleFocus, 100);
            }
        });

        return () => {
            window.removeEventListener('click', handleFocus);
        };
    }, []);

    const handleKeyDown = (e) => {
        const historyCommands = getCommandHistory();

        if (e.key === 'Enter') {
            e.preventDefault();

            if (currentCommand.trim() === '') {
                // Add empty command with just prompt
                setCommandHistory(prev => [
                    ...prev,
                    { type: 'command', text: prompt + currentCommand }
                ]);
            } else {
                // Execute command and get result
                const result = executeCommand(currentCommand);

                // Add command and result to terminal history
                setCommandHistory(prev => [
                    ...prev,
                    { type: 'command', text: prompt + currentCommand },
                    { type: 'output', text: result }
                ]);

                // Add to command history for up/down navigation
                addToCommandHistory(currentCommand);
            }

            // Reset history index and clear current command
            setHistoryIndex(-1);
            setCurrentCommand('');
        }
        else if (e.key === 'ArrowUp') {
            e.preventDefault();

            // Navigate up through command history
            if (historyCommands.length > 0) {
                const newIndex = historyIndex < historyCommands.length - 1 ? historyIndex + 1 : historyIndex;
                setHistoryIndex(newIndex);
                setCurrentCommand(historyCommands[historyCommands.length - 1 - newIndex] || '');
            }
        }
        else if (e.key === 'ArrowDown') {
            e.preventDefault();

            // Navigate down through command history
            if (historyIndex > 0) {
                const newIndex = historyIndex - 1;
                setHistoryIndex(newIndex);
                setCurrentCommand(historyCommands[historyCommands.length - 1 - newIndex] || '');
            } else if (historyIndex === 0) {
                setHistoryIndex(-1);
                setCurrentCommand('');
            }
        }
        else if (e.key === 'Tab') {
            e.preventDefault();
            
        }
    };

    return (
        <div className="terminal-container terminal-open" onClick={() => inputRef.current?.focus()}>
            <div className="terminal-header">
                <div className="terminal-title">Terminal</div>
                <div className="terminal-controls">
                    <span className="terminal-minimize"></span>
                    <span className="terminal-maximize"></span>
                    <span className="terminal-close"></span>
                </div>
            </div>

            <div className="terminal-body" ref={terminalRef}>
                <div className="terminal-welcome">
                    Welcome to a terminal@pnbe!
                    Type 'help' for available commands. You can navigate the entire site using this terminal (or at least that's the idea).
                </div>

                {commandHistory.length > 0 && (
                    <div className="terminal-history">
                        {commandHistory.map((item, index) => (
                            <div
                                key={index}
                                className={`terminal-line ${item.type === 'output' ? 'terminal-output' : ''}`}
                            >
                                {item.text}
                            </div>
                        ))}
                    </div>
                )}

                <div className="terminal-input-line">
                    <span className="terminal-prompt">{prompt}</span>
                    <input
                        ref={inputRef}
                        type="text"
                        className="terminal-input"
                        value={currentCommand}
                        onChange={(e) => setCurrentCommand(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                </div>
            </div>
        </div>
    );
};

export default Terminal;