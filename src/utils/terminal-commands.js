/**
 * Terminal command handling utilities
 */

// Available pages for navigation
const PAGES = {
    '/': 'Home',
    '/about': 'About',
    '/projects': 'Projects',
    '/blog': 'Blog',
    '/contact': 'Contact',
};

// Command history store (for up/down arrows)
let commandHistory = [];
const MAX_HISTORY_LENGTH = 50;

// Browser history index tracker
let browserHistoryIndex = 0;

// Blog posts cache with ID mapping
let blogPosts = [];
let idToSlugMap = {};

/**
 * Add a command to the history
 * @param {string} command - The command to add
 */
export const addToCommandHistory = (command) => {
    // Only add non-empty commands
    if (command && command.trim()) {
        // Prevent duplicate consecutive commands
        if (commandHistory.length === 0 || commandHistory[commandHistory.length - 1] !== command) {
            commandHistory.push(command);

            // Limit history length
            if (commandHistory.length > MAX_HISTORY_LENGTH) {
                commandHistory = commandHistory.slice(commandHistory.length - MAX_HISTORY_LENGTH);
            }

            // Store in localStorage for persistence
            try {
                localStorage.setItem('terminalCommandHistory', JSON.stringify(commandHistory));
            } catch (e) {
                // Handle potential localStorage errors
                console.error('Error saving command history to localStorage', e);
            }
        }
    }
};

/**
 * Get the command history
 * @returns {string[]} - The command history array
 */
export const getCommandHistory = () => {
    // Try to load from localStorage on first access
    if (commandHistory.length === 0) {
        try {
            const storedHistory = localStorage.getItem('terminalCommandHistory');
            if (storedHistory) {
                commandHistory = JSON.parse(storedHistory);
            }
        } catch (e) {
            console.error('Error loading command history from localStorage', e);
        }
    }

    return commandHistory;
};

/**
 * Execute a terminal command and return the result
 * @param {string} command - The command to execute
 * @returns {string} - The command result to display
 */
export const executeCommand = (command) => {
    const cmd = command.trim().toLowerCase();
    const args = cmd.split(' ');
    const primaryCommand = args[0];

    // Handle commands
    switch (primaryCommand) {
        case 'help':
            return getHelpText();

        // case 'clear':
        // case 'cls':
        //     // Clear will be handled by the terminal component
        //     setTimeout(() => {
        //         document.querySelector('.terminal-body').innerHTML = '';
        //     }, 10);
        //     return '';

        case 'ls':
            return args[1] === 'blog' ? listBlogPosts() : getListText();

        case 'cd':
            return changeDirectory(args[1]);

        case 'cat':
            return viewPage(args[1]);

        case 'pwd':
            return getCurrentPath();

        case 'whoami':
            return 'guest';

        case 'date':
            return new Date().toString();

        case 'echo':
            return args.slice(1).join(' ');

        case 'theme':
            return getThemeInfo();

        case 'open':
            return openPage(args[1]);

        case 'blog':
            return 'Navigating to blog...\n' + navigateToPath('/blog');

        case 'view-post':
            return viewBlogPost(args[1]);

        case 'search-blog':
            return searchBlog(args.slice(1).join(' '));

        case 'history':
            return showCommandHistory();

        case 'back':
            return navigateBack();

        case 'forward':
            return navigateForward();

        case '':
            return '';

        default:
            return `Command not found: ${primaryCommand}. Type 'help' for available commands.`;
    }
};

/**
 * Get help text for available commands
 */
const getHelpText = () => {
    return `
Available commands:
  help                     Show this help message
  ls                       List available pages
  ls blog                  List all blog posts
  cd [page]                Navigate to a page
  cat [page]               View page content
  pwd                      Show current page path
  whoami                   Display current user
  date                     Show current date/time
  echo [text]              Display text
  theme                    Show theme information
  open [page]              Open a page in the main content area
  blog                     Navigate to the blog
  view-post [id]           View a specific blog post by ID
  search-blog [query]      Search blog posts by keyword
  history                  Show command history
  back                     Go back in browser history
  forward                  Go forward in browser history
  
Navigation tips:
  - Use UP/DOWN arrow keys to navigate through command history
  - Press TAB for command auto-completion (coming soon)
`;
};

/**
 * List available pages
 */
const getListText = () => {
    return Object.entries(PAGES)
        .map(([path, name]) => `${path} - ${name}`)
        .join('\n');
};

/**
 * Change directory (navigate to a page)
 */
const changeDirectory = (path) => {
    if (!path) {
        return 'Please specify a path. Example: cd /about';
    }

    // Check if it's a blog post path
    if (path.match(/^\/blog\/[a-z0-9-]+$/)) {
        const postId = path.split('/').pop();
        return viewBlogPost(postId);
    }

    // Normalize path
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    if (PAGES[normalizedPath]) {
        // Save current history index before navigating
        browserHistoryIndex = window.history.length;

        // Navigate to the page
        window.location.href = normalizedPath;
        return `Navigating to ${PAGES[normalizedPath]}...`;
    } else {
        return `Directory not found: ${path}`;
    }
};

/**
 * Open a page in the main content area without navigating
 */
const openPage = (path) => {
    if (!path) {
        return 'Please specify a path. Example: open /about';
    }

    // Normalize path
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    if (PAGES[normalizedPath]) {
        // Update the main content area via fetch
        fetch(normalizedPath)
            .then(response => response.text())
            .then(html => {
                // Extract just the main content
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const mainContent = doc.querySelector('main').innerHTML;

                // Update the current main content
                document.querySelector('main').innerHTML = mainContent;

                // Update browser history without navigation
                window.history.pushState({}, PAGES[normalizedPath], normalizedPath);
                browserHistoryIndex = window.history.length;
            });

        return `Opening ${PAGES[normalizedPath]} in main content area...`;
    } else {
        return `Page not found: ${path}`;
    }
};

/**
 * View page content
 */
const viewPage = (path) => {
    if (!path) {
        return 'Please specify a path. Example: cat /about';
    }

    // Handle blog post paths
    if (path.match(/^\/blog\/[a-z0-9-]+$/)) {
        const postId = path.split('/').pop();
        return `Viewing blog post: ${postId}\nUse 'view-post ${postId}' to open the full post.`;
    }

    // Normalize path
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    if (PAGES[normalizedPath]) {
        return `Viewing content for ${PAGES[normalizedPath]} (preview):\n-----\nThis is a preview of the ${PAGES[normalizedPath]} page content.\nUse 'cd ${normalizedPath}' to navigate to the full page.\n-----`;
    } else {
        return `File not found: ${path}`;
    }
};

/**
 * Get current path
 */
const getCurrentPath = () => {
    return window.location.pathname;
};

/**
 * Get theme information
 */
const getThemeInfo = () => {
    return 'Current theme: Catppuccin Mocha\nA soothing pastel theme for the high-spirited!';
};

/**
 * Navigate to a specific path
 */
const navigateToPath = (path) => {
    // Save current history index before navigating
    browserHistoryIndex = window.history.length;

    window.location.href = path;
    return `Navigating to ${path}...`;
};

/**
 * View a specific blog post by ID
 */
const viewBlogPost = (postId) => {
    if (!postId) {
        return 'Please specify a post ID. Example: view-post my-first-post';
    }

    // Load the mapping if we don't have it already
    if (Object.keys(idToSlugMap).length === 0) {
        cacheBlogPostsData();
    }

    // Save current history index before navigating
    browserHistoryIndex = window.history.length;

    // Check if this is a custom ID or a slug
    if (idToSlugMap[postId]) {
        window.location.href = `/blog/${idToSlugMap[postId]}`;
        return `Opening blog post: ${postId}...`;
    } else {
        // If not found in the map, try using it directly as a slug
        window.location.href = `/blog/${postId}`;
        return `Opening blog post: ${postId}...`;
    }
};

/**
 * Cache blog post data for efficient ID lookups
 */
const cacheBlogPostsData = () => {
    try {
        const blogElements = document.querySelectorAll('.blog-card');

        if (blogElements.length > 0) {
            blogPosts = [];
            idToSlugMap = {};

            blogElements.forEach(element => {
                const idText = element.querySelector('.post-id').textContent;
                const id = idText.replace('ID: ', '');
                const title = element.querySelector('.post-title a').textContent;
                const date = element.querySelector('.post-date').textContent;
                const href = element.querySelector('.post-title a').getAttribute('href');
                const slug = href.replace('/blog/', '');

                blogPosts.push({ id, title, date, slug });

                // Only add to map if id is different from slug
                if (id !== slug) {
                    idToSlugMap[id] = slug;
                }
            });
        }
    } catch (error) {
        console.error('Error caching blog posts data', error);
    }
};

/**
 * List all blog posts
 */
const listBlogPosts = () => {
    try {
        // Attempt to load blog posts if we don't have them cached
        if (blogPosts.length === 0) {
            cacheBlogPostsData();

            if (blogPosts.length === 0) {
                return 'Blog posts could not be loaded. Navigate to the blog with "cd /blog" first.';
            }
        }

        // Format the blog posts list
        return blogPosts.map(post =>
            `[${post.id}] ${post.title} - ${post.date}`
        ).join('\n');
    } catch (error) {
        return 'Error loading blog posts. Try "cd /blog" to see all posts.';
    }
};

/**
 * Search blog posts by keyword
 */
const searchBlog = (query) => {
    if (!query) {
        return 'Please provide a search term. Example: search-blog javascript';
    }

    // Save current history index before navigating
    browserHistoryIndex = window.history.length;

    // Ideally this would search the actual content
    // For now, we'll redirect to the blog page with a search parameter
    window.location.href = `/blog?search=${encodeURIComponent(query)}`;
    return `Searching blog for "${query}"...`;
};

/**
 * Show command history
 */
const showCommandHistory = () => {
    const history = getCommandHistory();

    if (history.length === 0) {
        return 'No command history available.';
    }

    // Format each command with a number
    return history.map((cmd, index) =>
        `${(index + 1).toString().padStart(3, ' ')}  ${cmd}`
    ).join('\n');
};

/**
 * Navigate back in browser history
 */
const navigateBack = () => {
    if (window.history.length > 1 && window.history.length > browserHistoryIndex) {
        window.history.back();
        return 'Navigating back...';
    } else {
        return 'No previous page in history.';
    }
};

/**
 * Navigate forward in browser history
 */
const navigateForward = () => {
    if (browserHistoryIndex < window.history.length - 1) {
        window.history.forward();
        return 'Navigating forward...';
    } else {
        return 'No next page in history.';
    }
};