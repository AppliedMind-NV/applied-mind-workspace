export interface BuildStep {
  title: string;
  description: string;
  hint: string;
  encouragement?: string;
  starterCode?: string;
  solution: string;
}

export interface PracticeBuild {
  id: string;
  title: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  description: string;
  learningGoals: string[];
  skills: string[];
  estimatedMinutes: number;
  language: string;
  steps: BuildStep[];
}

export const PRACTICE_BUILDS: PracticeBuild[] = [
  {
    id: "calculator",
    title: "Build a Calculator",
    difficulty: "beginner",
    description: "Create a simple calculator that performs basic arithmetic operations. A great first project!",
    learningGoals: ["Functions", "User input", "Conditionals", "Error handling"],
    skills: ["Python basics", "Functions", "Control flow"],
    estimatedMinutes: 15,
    language: "python",
    steps: [
      {
        title: "Define the operation functions",
        description: "Let's start by creating four functions: add, subtract, multiply, and divide. Each takes two numbers and returns the result.",
        hint: "Start with `def add(a, b):` and return `a + b`. Don't forget to handle division by zero!",
        encouragement: "Nice! Building small functions is the foundation of good code. You've got this! 💪",
        starterCode: "# Step 1: Define your math functions\n# Let's build each one — they're simple but powerful!\n\ndef add(a, b):\n    pass\n\ndef subtract(a, b):\n    pass\n\ndef multiply(a, b):\n    pass\n\ndef divide(a, b):\n    pass\n",
        solution: "def add(a, b):\n    return a + b\n\ndef subtract(a, b):\n    return a - b\n\ndef multiply(a, b):\n    return a * b\n\ndef divide(a, b):\n    if b == 0:\n        return 'Error: Division by zero'\n    return a / b\n",
      },
      {
        title: "Build the calculator menu",
        description: "Now let's wire it all together! Create a function that displays options and gets the user's choice of operation.",
        hint: "Use print() to show numbered options and input() to get the choice.",
        encouragement: "You just built a working calculator from scratch. That's real programming! 🎉",
        starterCode: "# Step 2: Create the menu\ndef calculator():\n    print('Simple Calculator')\n    print('1. Add')\n    print('2. Subtract')\n    print('3. Multiply')\n    print('4. Divide')\n    # Get user choice and numbers here\n",
        solution: "def calculator():\n    print('Simple Calculator')\n    print('1. Add')\n    print('2. Subtract')\n    print('3. Multiply')\n    print('4. Divide')\n    \n    choice = input('Choose operation (1-4): ')\n    num1 = float(input('Enter first number: '))\n    num2 = float(input('Enter second number: '))\n    \n    if choice == '1':\n        print(f'Result: {add(num1, num2)}')\n    elif choice == '2':\n        print(f'Result: {subtract(num1, num2)}')\n    elif choice == '3':\n        print(f'Result: {multiply(num1, num2)}')\n    elif choice == '4':\n        print(f'Result: {divide(num1, num2)}')\n    else:\n        print('Invalid choice')\n\ncalculator()\n",
      },
    ],
  },
  {
    id: "guessing-game",
    title: "Build a Number Guessing Game",
    difficulty: "beginner",
    description: "Create a game where the computer picks a random number and the player tries to guess it. Fun and teaches loops!",
    learningGoals: ["Loops", "Random module", "Comparisons", "Counter variables"],
    skills: ["Python basics", "Loops", "Logic"],
    estimatedMinutes: 15,
    language: "python",
    steps: [
      {
        title: "Generate a random number",
        description: "First, let's import the random module and generate a secret number between 1 and 100.",
        hint: "Use `import random` and `random.randint(1, 100)` to pick a number.",
        encouragement: "Great start! The computer has a secret — now let's help the player figure it out.",
        starterCode: "# Step 1: Generate the secret number\nimport random\n\n# Pick a random number between 1 and 100\nsecret = None  # Replace with random number\nprint('I picked a number between 1 and 100!')\n",
        solution: "import random\n\nsecret = random.randint(1, 100)\nprint('I picked a number between 1 and 100!')\n",
      },
      {
        title: "Build the guessing loop",
        description: "Now the fun part! Create a while loop that keeps asking the player to guess until they get it right. Give hints like 'too high' or 'too low'.",
        hint: "Use a `while True:` loop with `if guess < secret:` for 'too low' and `elif guess > secret:` for 'too high'.",
        encouragement: "You built a complete game! This is how real game logic works. 🎮",
        starterCode: "# Step 2: Build the game loop\nattempts = 0\n\nwhile True:\n    guess = int(input('Your guess: '))\n    attempts += 1\n    # Add your comparison logic here\n    # Break when they guess correctly\n",
        solution: "import random\n\nsecret = random.randint(1, 100)\nprint('I picked a number between 1 and 100!')\nattempts = 0\n\nwhile True:\n    guess = int(input('Your guess: '))\n    attempts += 1\n    \n    if guess < secret:\n        print('Too low! Try again.')\n    elif guess > secret:\n        print('Too high! Try again.')\n    else:\n        print(f'Correct! You got it in {attempts} attempts!')\n        break\n",
      },
    ],
  },
  {
    id: "todo-engine",
    title: "Build a To-Do List Engine",
    difficulty: "beginner",
    description: "Create a command-line to-do list manager. Learn how real apps handle data with add, view, complete, and remove.",
    learningGoals: ["Lists", "Dictionaries", "CRUD operations", "Menu-driven programs"],
    skills: ["Data structures", "CRUD", "Python basics"],
    estimatedMinutes: 20,
    language: "python",
    steps: [
      {
        title: "Set up the data structure",
        description: "Let's create a list to store tasks. Each task should be a dictionary with 'title' and 'done' keys. This is how real apps think about data!",
        hint: "Use a list of dictionaries: `tasks = []` and `{'title': 'My task', 'done': False}`.",
        encouragement: "You just designed a data model — that's what real developers do before writing any feature! 🧠",
        starterCode: "# Step 1: Data structure\ntasks = []\n\ndef add_task(title):\n    pass\n\ndef view_tasks():\n    pass\n\ndef complete_task(index):\n    pass\n",
        solution: "tasks = []\n\ndef add_task(title):\n    tasks.append({'title': title, 'done': False})\n    print(f'Added: {title}')\n\ndef view_tasks():\n    if not tasks:\n        print('No tasks yet!')\n        return\n    for i, task in enumerate(tasks):\n        status = '✓' if task['done'] else '○'\n        print(f'{i + 1}. [{status}] {task[\"title\"]}')\n\ndef complete_task(index):\n    if 0 <= index < len(tasks):\n        tasks[index]['done'] = True\n        print(f'Completed: {tasks[index][\"title\"]}')\n    else:\n        print('Invalid task number')\n",
      },
      {
        title: "Build the menu loop",
        description: "Now let's create a main loop that presents options: Add, View, Complete, and Quit. This is a menu-driven program — a classic pattern!",
        hint: "Use a while loop with input() to get the user's choice, then call the appropriate function.",
        encouragement: "You've built a complete CRUD app! Add, Read, Update — these are the building blocks of every app. 🚀",
        solution: "def main():\n    while True:\n        print('\\n--- To-Do List ---')\n        print('1. Add task')\n        print('2. View tasks')\n        print('3. Complete task')\n        print('4. Quit')\n        \n        choice = input('Choose (1-4): ')\n        \n        if choice == '1':\n            title = input('Task title: ')\n            add_task(title)\n        elif choice == '2':\n            view_tasks()\n        elif choice == '3':\n            view_tasks()\n            idx = int(input('Task number to complete: ')) - 1\n            complete_task(idx)\n        elif choice == '4':\n            print('Goodbye!')\n            break\n\nmain()\n",
      },
    ],
  },
  {
    id: "quiz-app",
    title: "Build a Quiz App",
    difficulty: "intermediate",
    description: "Create a quiz application that presents questions, tracks scores, and shows results. Great for learning data structures!",
    learningGoals: ["Data structures", "Scoring logic", "String formatting", "Program flow"],
    skills: ["Dictionaries", "Loops", "String formatting"],
    estimatedMinutes: 25,
    language: "python",
    steps: [
      {
        title: "Define quiz data",
        description: "First, let's think about how to structure quiz data. Create a list of question dictionaries, each with 'question', 'options' (list), and 'answer' (correct option index).",
        hint: "Structure: `[{'question': '...', 'options': ['A', 'B', 'C', 'D'], 'answer': 0}]`",
        encouragement: "Great data design! Thinking about structure first makes everything else easier.",
        starterCode: "# Step 1: Define your quiz questions\nquestions = [\n    {\n        'question': 'What keyword defines a function in Python?',\n        'options': ['func', 'def', 'function', 'define'],\n        'answer': 1\n    },\n    # Add more questions here\n]\n",
        solution: "questions = [\n    {\n        'question': 'What keyword defines a function in Python?',\n        'options': ['func', 'def', 'function', 'define'],\n        'answer': 1\n    },\n    {\n        'question': 'Which data type stores True or False?',\n        'options': ['string', 'integer', 'boolean', 'float'],\n        'answer': 2\n    },\n    {\n        'question': 'What does len() return?',\n        'options': ['The type', 'The length', 'The sum', 'The max'],\n        'answer': 1\n    },\n]\n",
      },
      {
        title: "Build the quiz engine",
        description: "Now the exciting part — loop through questions, display options, get answers, track score, and show results with encouraging feedback at the end!",
        hint: "Use enumerate() to number questions. Compare the user's answer to the correct index.",
        encouragement: "You built a real quiz engine! This same pattern powers educational apps everywhere. 🏆",
        solution: "def run_quiz(questions):\n    score = 0\n    total = len(questions)\n    \n    for i, q in enumerate(questions):\n        print(f'\\nQuestion {i + 1}/{total}: {q[\"question\"]}')\n        for j, option in enumerate(q['options']):\n            print(f'  {j + 1}. {option}')\n        \n        try:\n            answer = int(input('Your answer (number): ')) - 1\n            if answer == q['answer']:\n                print('✓ Correct!')\n                score += 1\n            else:\n                print(f'✗ Wrong! The answer was: {q[\"options\"][q[\"answer\"]]}')\n        except ValueError:\n            print('Invalid input, skipping...')\n    \n    pct = round(score / total * 100)\n    print(f'\\n--- Results ---')\n    print(f'Score: {score}/{total} ({pct}%)')\n    if pct >= 80:\n        print('Great job! 🎉')\n    elif pct >= 50:\n        print('Good effort! Keep studying.')\n    else:\n        print('Keep practicing, you\\'ll get there!')\n\nrun_quiz(questions)\n",
      },
    ],
  },
  {
    id: "grade-tracker",
    title: "Build a Grade Tracker",
    difficulty: "intermediate",
    description: "Create a grade tracking system that calculates averages, assigns letter grades, and tracks by subject.",
    learningGoals: ["Statistics logic", "Formatted output", "Functions with returns", "Data processing"],
    skills: ["Math operations", "Dictionaries", "Functions"],
    estimatedMinutes: 25,
    language: "python",
    steps: [
      {
        title: "Create grade utility functions",
        description: "Let's build the brain of our tracker: functions to calculate averages, find min/max, and convert numeric grades to letter grades.",
        hint: "For letter grades: 90+ = A, 80+ = B, 70+ = C, 60+ = D, below = F.",
        encouragement: "These utility functions are reusable — you could drop them into any project! 🔧",
        starterCode: "# Step 1: Grade utility functions\ndef calculate_average(grades):\n    pass\n\ndef get_letter_grade(score):\n    pass\n\ndef grade_summary(grades):\n    pass\n",
        solution: "def calculate_average(grades):\n    if not grades:\n        return 0\n    return sum(grades) / len(grades)\n\ndef get_letter_grade(score):\n    if score >= 90:\n        return 'A'\n    elif score >= 80:\n        return 'B'\n    elif score >= 70:\n        return 'C'\n    elif score >= 60:\n        return 'D'\n    return 'F'\n\ndef grade_summary(grades):\n    if not grades:\n        print('No grades recorded yet.')\n        return\n    avg = calculate_average(grades)\n    print(f'\\n--- Grade Summary ---')\n    print(f'Grades: {grades}')\n    print(f'Average: {avg:.1f} ({get_letter_grade(avg)})')\n    print(f'Highest: {max(grades)}')\n    print(f'Lowest: {min(grades)}')\n    print(f'Total assignments: {len(grades)}')\n",
      },
      {
        title: "Build the interactive tracker",
        description: "Wire it up! Create a menu loop where users can add grades, view summary, view by subject, and quit.",
        hint: "Use a grades list and a while loop with input for menu choices.",
        encouragement: "You've built something genuinely useful — students could actually use this! 📊",
        solution: "def main():\n    grades = []\n    subjects = {}\n    \n    while True:\n        print('\\n--- Grade Tracker ---')\n        print('1. Add grade')\n        print('2. View summary')\n        print('3. View by subject')\n        print('4. Quit')\n        \n        choice = input('Choose (1-4): ')\n        \n        if choice == '1':\n            subject = input('Subject: ')\n            score = float(input('Grade (0-100): '))\n            grades.append(score)\n            if subject not in subjects:\n                subjects[subject] = []\n            subjects[subject].append(score)\n            letter = get_letter_grade(score)\n            print(f'Added {score} ({letter}) for {subject}')\n        elif choice == '2':\n            grade_summary(grades)\n        elif choice == '3':\n            for subj, scores in subjects.items():\n                avg = calculate_average(scores)\n                print(f'{subj}: {avg:.1f} ({get_letter_grade(avg)})')\n        elif choice == '4':\n            print('Goodbye!')\n            break\n\nmain()\n",
      },
    ],
  },
  {
    id: "flashcard-engine",
    title: "Build a Flashcard Engine",
    difficulty: "intermediate",
    description: "Create a terminal flashcard system with add, study, and shuffle features. Meta: building the tool you're using to study!",
    learningGoals: ["Classes or dicts", "Random shuffling", "File-like persistence", "Interactive loops"],
    skills: ["Data structures", "Random module", "Loops"],
    estimatedMinutes: 20,
    language: "python",
    steps: [
      {
        title: "Define the flashcard data and functions",
        description: "Create functions to add cards, study cards (showing front, then revealing back on keypress), and shuffle the deck.",
        hint: "Store cards as a list of `{'front': ..., 'back': ...}` dicts. Use `random.shuffle()` for shuffling.",
        encouragement: "You're building a study tool while studying — how cool is that? 🧠",
        starterCode: "import random\n\ncards = []\n\ndef add_card(front, back):\n    pass\n\ndef study(deck):\n    pass\n",
        solution: "import random\n\ncards = []\n\ndef add_card(front, back):\n    cards.append({'front': front, 'back': back})\n    print(f'Card added! ({len(cards)} total)')\n\ndef study(deck):\n    if not deck:\n        print('No cards to study!')\n        return\n    shuffled = deck.copy()\n    random.shuffle(shuffled)\n    score = 0\n    for i, card in enumerate(shuffled):\n        print(f'\\nCard {i+1}/{len(shuffled)}')\n        print(f'Front: {card[\"front\"]}')\n        input('Press Enter to reveal...')\n        print(f'Back: {card[\"back\"]}')\n        got_it = input('Did you know it? (y/n): ')\n        if got_it.lower() == 'y':\n            score += 1\n    print(f'\\nScore: {score}/{len(shuffled)}')\n",
      },
      {
        title: "Build the main menu",
        description: "Create a menu with: Add card, Study all, View count, Quit.",
        hint: "Use a while True loop with input() for navigation.",
        encouragement: "Complete! You've built a flashcard engine from scratch. You understand loops, data, and user interaction! 🎯",
        solution: "def main():\n    while True:\n        print(f'\\n--- Flashcards ({len(cards)} cards) ---')\n        print('1. Add card')\n        print('2. Study')\n        print('3. Quit')\n        \n        choice = input('Choose: ')\n        if choice == '1':\n            front = input('Front (question): ')\n            back = input('Back (answer): ')\n            add_card(front, back)\n        elif choice == '2':\n            study(cards)\n        elif choice == '3':\n            break\n\nmain()\n",
      },
    ],
  },
  {
    id: "password-generator",
    title: "Build a Password Generator",
    difficulty: "beginner",
    description: "Create a tool that generates secure random passwords with customizable length and character types.",
    learningGoals: ["String operations", "Random module", "Boolean flags", "String concatenation"],
    skills: ["Python basics", "Strings", "Random"],
    estimatedMinutes: 15,
    language: "python",
    steps: [
      {
        title: "Create the character pools",
        description: "Define strings for lowercase, uppercase, digits, and special characters. Then build a function that combines them based on user preferences.",
        hint: "Use `string` module: `string.ascii_lowercase`, `string.ascii_uppercase`, `string.digits`, `string.punctuation`.",
        encouragement: "You're thinking about security! Character pools are how real password managers work. 🔐",
        starterCode: "import string\nimport random\n\ndef generate_password(length=12, use_upper=True, use_digits=True, use_special=True):\n    # Build the character pool based on options\n    pool = string.ascii_lowercase\n    # Add more character types here\n    pass\n",
        solution: "import string\nimport random\n\ndef generate_password(length=12, use_upper=True, use_digits=True, use_special=True):\n    pool = string.ascii_lowercase\n    if use_upper:\n        pool += string.ascii_uppercase\n    if use_digits:\n        pool += string.digits\n    if use_special:\n        pool += string.punctuation\n    \n    password = ''.join(random.choice(pool) for _ in range(length))\n    return password\n",
      },
      {
        title: "Add the interactive interface",
        description: "Let the user choose password length and options, then generate and display the password!",
        hint: "Use input() to ask for length, and yes/no questions for each character type.",
        encouragement: "You just built a real utility tool! You could actually use this. 🛠️",
        solution: "def main():\n    print('🔐 Password Generator')\n    length = int(input('Password length (default 12): ') or '12')\n    use_upper = input('Include uppercase? (y/n): ').lower() != 'n'\n    use_digits = input('Include digits? (y/n): ').lower() != 'n'\n    use_special = input('Include special chars? (y/n): ').lower() != 'n'\n    \n    for i in range(3):\n        pwd = generate_password(length, use_upper, use_digits, use_special)\n        print(f'  Option {i+1}: {pwd}')\n    \n    print('\\nPick your favorite!')\n\nmain()\n",
      },
    ],
  },
  {
    id: "contact-book",
    title: "Build a Contact Book",
    difficulty: "intermediate",
    description: "Build a contact management system with search, categories, and formatted display. Learn real data management!",
    learningGoals: ["Nested dictionaries", "Search algorithms", "String matching", "Data organization"],
    skills: ["Dictionaries", "Search", "String methods"],
    estimatedMinutes: 30,
    language: "python",
    steps: [
      {
        title: "Design the contact data model",
        description: "Create functions to add contacts with name, phone, email, and category. Store them in a dictionary keyed by name.",
        hint: "Use a dictionary: `contacts = {}` where each key is a name and the value is another dict with phone, email, category.",
        encouragement: "You're designing a data model — this is exactly what backend developers do! 📇",
        starterCode: "contacts = {}\n\ndef add_contact(name, phone, email, category='general'):\n    pass\n\ndef search_contacts(query):\n    pass\n\ndef display_contact(name, info):\n    pass\n",
        solution: "contacts = {}\n\ndef add_contact(name, phone, email, category='general'):\n    contacts[name] = {\n        'phone': phone,\n        'email': email,\n        'category': category\n    }\n    print(f'Added {name} to contacts!')\n\ndef search_contacts(query):\n    results = []\n    query = query.lower()\n    for name, info in contacts.items():\n        if query in name.lower() or query in info.get('email', '').lower():\n            results.append((name, info))\n    return results\n\ndef display_contact(name, info):\n    print(f'  {name}')\n    print(f'    📞 {info[\"phone\"]}')\n    print(f'    ✉️  {info[\"email\"]}')\n    print(f'    📁 {info[\"category\"]}')\n",
      },
      {
        title: "Build the full interface",
        description: "Create a menu-driven interface with: Add, Search, List all, List by category, and Quit.",
        hint: "Use a while True loop. For category filtering, loop through contacts and check if the category matches.",
        encouragement: "This is a real CRUD application with search — you're thinking like a developer! 🚀",
        solution: "def main():\n    while True:\n        print(f'\\n--- Contact Book ({len(contacts)} contacts) ---')\n        print('1. Add contact')\n        print('2. Search')\n        print('3. List all')\n        print('4. List by category')\n        print('5. Quit')\n        \n        choice = input('Choose: ')\n        \n        if choice == '1':\n            name = input('Name: ')\n            phone = input('Phone: ')\n            email = input('Email: ')\n            category = input('Category (default general): ') or 'general'\n            add_contact(name, phone, email, category)\n        elif choice == '2':\n            query = input('Search: ')\n            results = search_contacts(query)\n            if results:\n                for name, info in results:\n                    display_contact(name, info)\n            else:\n                print('No contacts found.')\n        elif choice == '3':\n            for name, info in contacts.items():\n                display_contact(name, info)\n        elif choice == '4':\n            cat = input('Category: ')\n            for name, info in contacts.items():\n                if info['category'] == cat:\n                    display_contact(name, info)\n        elif choice == '5':\n            break\n\nmain()\n",
      },
    ],
  },
  {
    id: "text-analyzer",
    title: "Build a Text Analyzer",
    difficulty: "advanced",
    description: "Create a tool that analyzes text for word count, character frequency, readability, and common patterns.",
    learningGoals: ["String processing", "Counter/frequency analysis", "Statistical calculations", "Text algorithms"],
    skills: ["Strings", "Collections", "Algorithms"],
    estimatedMinutes: 35,
    language: "python",
    steps: [
      {
        title: "Build basic analysis functions",
        description: "Create functions for word count, character count, sentence count, and average word length.",
        hint: "Use `split()` for words, `split('.')` for sentences, and `len()` for counts.",
        encouragement: "Text analysis is used everywhere — from search engines to AI. You're learning powerful skills! 📝",
        starterCode: "def word_count(text):\n    pass\n\ndef char_count(text):\n    pass\n\ndef sentence_count(text):\n    pass\n\ndef avg_word_length(text):\n    pass\n",
        solution: "def word_count(text):\n    return len(text.split())\n\ndef char_count(text):\n    return len(text)\n\ndef sentence_count(text):\n    return sum(1 for c in text if c in '.!?') or 1\n\ndef avg_word_length(text):\n    words = text.split()\n    if not words:\n        return 0\n    return sum(len(w) for w in words) / len(words)\n",
      },
      {
        title: "Add frequency analysis",
        description: "Build a frequency counter that finds the most common words and characters. Use collections.Counter for efficiency!",
        hint: "Import `Counter` from `collections`. Use `Counter(words).most_common(10)` for top words.",
        encouragement: "Frequency analysis is the foundation of data science and NLP. Impressive work! 📊",
        solution: "from collections import Counter\n\ndef word_frequency(text, top_n=10):\n    words = text.lower().split()\n    # Remove common punctuation\n    words = [w.strip('.,!?;:\"()') for w in words]\n    words = [w for w in words if len(w) > 2]  # Skip tiny words\n    return Counter(words).most_common(top_n)\n\ndef char_frequency(text, top_n=10):\n    chars = [c.lower() for c in text if c.isalpha()]\n    return Counter(chars).most_common(top_n)\n\ndef analyze(text):\n    print(f'\\n--- Text Analysis ---')\n    print(f'Words: {word_count(text)}')\n    print(f'Characters: {char_count(text)}')\n    print(f'Sentences: {sentence_count(text)}')\n    print(f'Avg word length: {avg_word_length(text):.1f}')\n    print(f'\\nTop words:')\n    for word, count in word_frequency(text):\n        print(f'  \"{word}\" — {count}x')\n    print(f'\\nTop characters:')\n    for char, count in char_frequency(text):\n        print(f'  \"{char}\" — {count}x')\n\n# Test it!\nsample = input('Paste some text to analyze: ')\nanalyze(sample)\n",
      },
    ],
  },
  {
    id: "expense-tracker",
    title: "Build an Expense Tracker",
    difficulty: "advanced",
    description: "Create a personal expense tracker with categories, monthly summaries, and budget alerts. Real-world finance logic!",
    learningGoals: ["Date handling", "Aggregation logic", "Budget comparison", "Formatted reports"],
    skills: ["Datetime", "Dictionaries", "Data aggregation"],
    estimatedMinutes: 40,
    language: "python",
    steps: [
      {
        title: "Design the expense model",
        description: "Create functions to add expenses with amount, category, description, and automatic date tracking.",
        hint: "Use `datetime.now()` for timestamps. Store expenses as a list of dictionaries.",
        encouragement: "You're building something people actually pay for in the App Store! 💰",
        starterCode: "from datetime import datetime\n\nexpenses = []\n\ndef add_expense(amount, category, description=''):\n    pass\n\ndef get_total():\n    pass\n\ndef get_by_category():\n    pass\n",
        solution: "from datetime import datetime\n\nexpenses = []\n\ndef add_expense(amount, category, description=''):\n    expenses.append({\n        'amount': amount,\n        'category': category,\n        'description': description,\n        'date': datetime.now()\n    })\n    print(f'Added ${amount:.2f} for {category}')\n\ndef get_total():\n    return sum(e['amount'] for e in expenses)\n\ndef get_by_category():\n    cats = {}\n    for e in expenses:\n        cat = e['category']\n        cats[cat] = cats.get(cat, 0) + e['amount']\n    return cats\n",
      },
      {
        title: "Add reports and budget alerts",
        description: "Build summary reports, category breakdowns, and a budget alert system that warns when spending exceeds limits.",
        hint: "Track budgets in a dictionary `budgets = {'food': 200, 'transport': 100}` and compare totals.",
        encouragement: "Budget alerts, category reports — you've built a real personal finance app! 🏦",
        solution: "budgets = {}\n\ndef set_budget(category, amount):\n    budgets[category] = amount\n    print(f'Budget for {category}: ${amount:.2f}')\n\ndef check_budgets():\n    cats = get_by_category()\n    print('\\n--- Budget Check ---')\n    for cat, spent in cats.items():\n        budget = budgets.get(cat)\n        if budget:\n            pct = (spent / budget) * 100\n            status = '⚠️ OVER' if spent > budget else '✓ OK'\n            print(f'{cat}: ${spent:.2f} / ${budget:.2f} ({pct:.0f}%) {status}')\n        else:\n            print(f'{cat}: ${spent:.2f} (no budget set)')\n\ndef summary():\n    print(f'\\n--- Expense Summary ---')\n    print(f'Total: ${get_total():.2f}')\n    print(f'Expenses: {len(expenses)}')\n    cats = get_by_category()\n    for cat, total in sorted(cats.items(), key=lambda x: -x[1]):\n        print(f'  {cat}: ${total:.2f}')\n    check_budgets()\n\ndef main():\n    while True:\n        print('\\n1. Add expense  2. Summary  3. Set budget  4. Quit')\n        c = input('Choose: ')\n        if c == '1':\n            amt = float(input('Amount: $'))\n            cat = input('Category: ')\n            desc = input('Description: ')\n            add_expense(amt, cat, desc)\n        elif c == '2':\n            summary()\n        elif c == '3':\n            cat = input('Category: ')\n            amt = float(input('Budget: $'))\n            set_budget(cat, amt)\n        elif c == '4':\n            break\n\nmain()\n",
      },
    ],
  },
];
