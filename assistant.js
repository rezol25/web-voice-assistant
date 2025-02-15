document.addEventListener('DOMContentLoaded', function() {
    const micButton = document.getElementById('micButton');
    const textInput = document.getElementById('textInput');
    const sendButton = document.getElementById('sendButton');
    const statusIndicator = document.getElementById('status-indicator');
    const statusText = document.getElementById('status-text');
    const conversation = document.getElementById('conversation');

    let recognition = null;
    if ('webkitSpeechRecognition' in window) {
        recognition = new webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
    }

    // Get initial greeting
    fetch('/get_greeting')
        .then(response => response.json())
        .then(data => {
            addMessage(data.greeting, 'assistant');
        });

    function updateStatus(status) {
        statusIndicator.className = 'status-circle ' + status;
        switch(status) {
            case 'listening':
                statusText.textContent = 'Listening...';
                break;
            case 'processing':
                statusText.textContent = 'Processing...';
                break;
            default:
                statusText.textContent = 'Click the microphone to start or type your command';
        }
    }

    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        messageDiv.textContent = text;
        conversation.appendChild(messageDiv);
        conversation.scrollTop = conversation.scrollHeight;
    }

    function speak(text) {
        const utterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
    }

    async function processCommand(command) {
        updateStatus('processing');
        addMessage(command, 'user');

        try {
            const response = await fetch('/process_command', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ command: command })
            });

            const data = await response.json();
            addMessage(data.response, 'assistant');
            speak(data.response);

            if (data.action === 'play' && data.url) {
                window.open(data.url, '_blank');
            }
        } catch (error) {
            console.error('Error:', error);
            addMessage('Sorry, there was an error processing your request.', 'assistant');
            speak('Sorry, there was an error processing your request.');
        }

        updateStatus('');
        textInput.value = ''; // Clear input after processing
    }

    // Text input handling
    sendButton.addEventListener('click', function() {
        const command = textInput.value.trim();
        if (command) {
            processCommand(command);
        }
    });

    textInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const command = textInput.value.trim();
            if (command) {
                processCommand(command);
            }
        }
    });

    // Voice input handling
    micButton.addEventListener('click', function() {
        if (recognition) {
            recognition.start();
            updateStatus('listening');
        } else {
            addMessage('Speech recognition is not supported in this browser.', 'assistant');
            speak('Speech recognition is not supported in this browser.');
        }
    });

    if (recognition) {
        recognition.onresult = function(event) {
            const command = event.results[0][0].transcript;
            processCommand(command);
        };

        recognition.onerror = function(event) {
            console.error('Speech recognition error:', event.error);
            updateStatus('');
            addMessage('Error capturing voice. Please try again.', 'assistant');
            speak('Error capturing voice. Please try again.');
        };

        recognition.onend = function() {
            updateStatus('');
        };
    }
});