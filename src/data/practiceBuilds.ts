export interface BuildStep {
  title: string;
  description: string;
  hint: string;
  starterCode?: string;
  solution: string;
}

export interface PracticeBuild {
  id: string;
  title: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  description: string;
  learningGoals: string[];
  language: string;
  steps: BuildStep[];
}

export const PRACTICE_BUILDS: PracticeBuild[] = [
  {
    id: "calculator",
    title: "Build a Calculator",
    difficulty: "beginner",
    description: "Create a simple calculator that performs basic arithmetic operations.",
    learningGoals: ["Functions", "User input", "Conditionals", "Error handling"],
    language: "python",
    steps: [
      {
        title: "Define the operation functions",
        description: "Create four functions: add, subtract, multiply, and divide. Each takes two numbers and returns the result.",
        hint: "Start with `def add(a, b):` and return `a + b`. Don't forget to handle division by zero!",
        starterCode: "# Step 1: Define your math functions\ndef add(a, b):\n    pass\n\ndef subtract(a, b):\n    pass\n\ndef multiply(a, b):\n    pass\n\ndef divide(a, b):\n    pass\n",
        solution: "def add(a, b):\n    return a + b\n\ndef subtract(a, b):\n    return a - b\n\ndef multiply(a, b):\n    return a * b\n\ndef divide(a, b):\n    if b == 0:\n        return 'Error: Division by zero'\n    return a / b\n",
      },
      {
        title: "Build the calculator menu",
        description: "Create a function that displays options and gets the user's choice of operation.",
        hint: "Use print() to show numbered options and input() to get the choice.",
        starterCode: "# Step 2: Create the menu\ndef calculator():\n    print('Simple Calculator')\n    print('1. Add')\n    print('2. Subtract')\n    print('3. Multiply')\n    print('4. Divide')\n    # Get user choice and numbers here\n",
        solution: "def calculator():\n    print('Simple Calculator')\n    print('1. Add')\n    print('2. Subtract')\n    print('3. Multiply')\n    print('4. Divide')\n    \n    choice = input('Choose operation (1-4): ')\n    num1 = float(input('Enter first number: '))\n    num2 = float(input('Enter second number: '))\n    \n    if choice == '1':\n        print(f'Result: {add(num1, num2)}')\n    elif choice == '2':\n        print(f'Result: {subtract(num1, num2)}')\n    elif choice == '3':\n        print(f'Result: {multiply(num1, num2)}')\n    elif choice == '4':\n        print(f'Result: {divide(num1, num2)}')\n    else:\n        print('Invalid choice')\n\ncalculator()\n",
      },
    ],
  },
  {
    id: "guessing-game",
    title: "Build a Number Guessing Game",
    difficulty: "beginner",
    description: "Create a game where the computer picks a random number and the player tries to guess it.",
    learningGoals: ["Loops", "Random module", "Comparisons", "Counter variables"],
    language: "python",
    steps: [
      {
        title: "Generate a random number",
        description: "Import the random module and generate a secret number between 1 and 100.",
        hint: "Use `import random` and `random.randint(1, 100)` to pick a number.",
        starterCode: "# Step 1: Generate the secret number\nimport random\n\n# Pick a random number between 1 and 100\nsecret = None  # Replace with random number\nprint('I picked a number between 1 and 100!')\n",
        solution: "import random\n\nsecret = random.randint(1, 100)\nprint('I picked a number between 1 and 100!')\n",
      },
      {
        title: "Build the guessing loop",
        description: "Create a while loop that keeps asking the player to guess until they get it right. Give hints like 'too high' or 'too low'.",
        hint: "Use a `while True:` loop with `if guess < secret:` for 'too low' and `elif guess > secret:` for 'too high'.",
        starterCode: "# Step 2: Build the game loop\nattempts = 0\n\nwhile True:\n    guess = int(input('Your guess: '))\n    attempts += 1\n    # Add your comparison logic here\n    # Break when they guess correctly\n",
        solution: "import random\n\nsecret = random.randint(1, 100)\nprint('I picked a number between 1 and 100!')\nattempts = 0\n\nwhile True:\n    guess = int(input('Your guess: '))\n    attempts += 1\n    \n    if guess < secret:\n        print('Too low! Try again.')\n    elif guess > secret:\n        print('Too high! Try again.')\n    else:\n        print(f'Correct! You got it in {attempts} attempts!')\n        break\n",
      },
    ],
  },
  {
    id: "todo-engine",
    title: "Build a To-Do List Engine",
    difficulty: "beginner",
    description: "Create a command-line to-do list manager that can add, view, complete, and remove tasks.",
    learningGoals: ["Lists", "Dictionaries", "CRUD operations", "Menu-driven programs"],
    language: "python",
    steps: [
      {
        title: "Set up the data structure",
        description: "Create a list to store tasks. Each task should be a dictionary with 'title' and 'done' keys.",
        hint: "Use a list of dictionaries: `tasks = []` and `{'title': 'My task', 'done': False}`.",
        starterCode: "# Step 1: Data structure\ntasks = []\n\ndef add_task(title):\n    pass\n\ndef view_tasks():\n    pass\n\ndef complete_task(index):\n    pass\n",
        solution: "tasks = []\n\ndef add_task(title):\n    tasks.append({'title': title, 'done': False})\n    print(f'Added: {title}')\n\ndef view_tasks():\n    if not tasks:\n        print('No tasks yet!')\n        return\n    for i, task in enumerate(tasks):\n        status = '✓' if task['done'] else '○'\n        print(f'{i + 1}. [{status}] {task[\"title\"]}')\n\ndef complete_task(index):\n    if 0 <= index < len(tasks):\n        tasks[index]['done'] = True\n        print(f'Completed: {tasks[index][\"title\"]}')\n    else:\n        print('Invalid task number')\n",
      },
      {
        title: "Build the menu loop",
        description: "Create a main loop that presents options: Add, View, Complete, and Quit.",
        hint: "Use a while loop with input() to get the user's choice, then call the appropriate function.",
        solution: "def main():\n    while True:\n        print('\\n--- To-Do List ---')\n        print('1. Add task')\n        print('2. View tasks')\n        print('3. Complete task')\n        print('4. Quit')\n        \n        choice = input('Choose (1-4): ')\n        \n        if choice == '1':\n            title = input('Task title: ')\n            add_task(title)\n        elif choice == '2':\n            view_tasks()\n        elif choice == '3':\n            view_tasks()\n            idx = int(input('Task number to complete: ')) - 1\n            complete_task(idx)\n        elif choice == '4':\n            print('Goodbye!')\n            break\n\nmain()\n",
      },
    ],
  },
  {
    id: "quiz-app",
    title: "Build a Quiz App",
    difficulty: "intermediate",
    description: "Create a quiz application that presents questions, tracks scores, and shows results.",
    learningGoals: ["Data structures", "Scoring logic", "String formatting", "Program flow"],
    language: "python",
    steps: [
      {
        title: "Define quiz data",
        description: "Create a list of question dictionaries, each with 'question', 'options' (list), and 'answer' (correct option index).",
        hint: "Structure: `[{'question': '...', 'options': ['A', 'B', 'C', 'D'], 'answer': 0}]`",
        starterCode: "# Step 1: Define your quiz questions\nquestions = [\n    {\n        'question': 'What keyword defines a function in Python?',\n        'options': ['func', 'def', 'function', 'define'],\n        'answer': 1\n    },\n    # Add more questions here\n]\n",
        solution: "questions = [\n    {\n        'question': 'What keyword defines a function in Python?',\n        'options': ['func', 'def', 'function', 'define'],\n        'answer': 1\n    },\n    {\n        'question': 'Which data type stores True or False?',\n        'options': ['string', 'integer', 'boolean', 'float'],\n        'answer': 2\n    },\n    {\n        'question': 'What does len() return?',\n        'options': ['The type', 'The length', 'The sum', 'The max'],\n        'answer': 1\n    },\n]\n",
      },
      {
        title: "Build the quiz engine",
        description: "Loop through questions, display options, get answers, track score, and show results at the end.",
        hint: "Use enumerate() to number questions. Compare the user's answer to the correct index.",
        solution: "def run_quiz(questions):\n    score = 0\n    total = len(questions)\n    \n    for i, q in enumerate(questions):\n        print(f'\\nQuestion {i + 1}/{total}: {q[\"question\"]}')\n        for j, option in enumerate(q['options']):\n            print(f'  {j + 1}. {option}')\n        \n        try:\n            answer = int(input('Your answer (number): ')) - 1\n            if answer == q['answer']:\n                print('✓ Correct!')\n                score += 1\n            else:\n                print(f'✗ Wrong! The answer was: {q[\"options\"][q[\"answer\"]]}')\n        except ValueError:\n            print('Invalid input, skipping...')\n    \n    pct = round(score / total * 100)\n    print(f'\\n--- Results ---')\n    print(f'Score: {score}/{total} ({pct}%)')\n    if pct >= 80:\n        print('Great job! 🎉')\n    elif pct >= 50:\n        print('Good effort! Keep studying.')\n    else:\n        print('Keep practicing, you\\'ll get there!')\n\nrun_quiz(questions)\n",
      },
    ],
  },
  {
    id: "grade-tracker",
    title: "Build a Grade Tracker",
    difficulty: "intermediate",
    description: "Create a grade tracking system that calculates averages, finds highest/lowest grades, and assigns letter grades.",
    learningGoals: ["Statistics logic", "Formatted output", "Functions with returns", "Data processing"],
    language: "python",
    steps: [
      {
        title: "Create grade utility functions",
        description: "Build functions to calculate average, find min/max, and convert numeric grades to letter grades.",
        hint: "For letter grades: 90+ = A, 80+ = B, 70+ = C, 60+ = D, below = F.",
        starterCode: "# Step 1: Grade utility functions\ndef calculate_average(grades):\n    pass\n\ndef get_letter_grade(score):\n    pass\n\ndef grade_summary(grades):\n    pass\n",
        solution: "def calculate_average(grades):\n    if not grades:\n        return 0\n    return sum(grades) / len(grades)\n\ndef get_letter_grade(score):\n    if score >= 90:\n        return 'A'\n    elif score >= 80:\n        return 'B'\n    elif score >= 70:\n        return 'C'\n    elif score >= 60:\n        return 'D'\n    return 'F'\n\ndef grade_summary(grades):\n    if not grades:\n        print('No grades recorded yet.')\n        return\n    avg = calculate_average(grades)\n    print(f'\\n--- Grade Summary ---')\n    print(f'Grades: {grades}')\n    print(f'Average: {avg:.1f} ({get_letter_grade(avg)})')\n    print(f'Highest: {max(grades)}')\n    print(f'Lowest: {min(grades)}')\n    print(f'Total assignments: {len(grades)}')\n",
      },
      {
        title: "Build the interactive tracker",
        description: "Create a menu loop where users can add grades, view summary, and quit.",
        hint: "Use a grades list and a while loop with input for menu choices.",
        solution: "def main():\n    grades = []\n    subjects = {}\n    \n    while True:\n        print('\\n--- Grade Tracker ---')\n        print('1. Add grade')\n        print('2. View summary')\n        print('3. View by subject')\n        print('4. Quit')\n        \n        choice = input('Choose (1-4): ')\n        \n        if choice == '1':\n            subject = input('Subject: ')\n            score = float(input('Grade (0-100): '))\n            grades.append(score)\n            if subject not in subjects:\n                subjects[subject] = []\n            subjects[subject].append(score)\n            letter = get_letter_grade(score)\n            print(f'Added {score} ({letter}) for {subject}')\n        elif choice == '2':\n            grade_summary(grades)\n        elif choice == '3':\n            for subj, scores in subjects.items():\n                avg = calculate_average(scores)\n                print(f'{subj}: {avg:.1f} ({get_letter_grade(avg)})')\n        elif choice == '4':\n            print('Goodbye!')\n            break\n\nmain()\n",
      },
    ],
  },
  {
    id: "flashcard-engine",
    title: "Build a Flashcard Engine",
    difficulty: "intermediate",
    description: "Create a terminal flashcard system with add, study, and shuffle features.",
    learningGoals: ["Classes or dicts", "Random shuffling", "File-like persistence", "Interactive loops"],
    language: "python",
    steps: [
      {
        title: "Define the flashcard data and functions",
        description: "Create functions to add cards, study cards (showing front, then revealing back on keypress), and shuffle the deck.",
        hint: "Store cards as a list of `{'front': ..., 'back': ...}` dicts. Use `random.shuffle()` for shuffling.",
        starterCode: "import random\n\ncards = []\n\ndef add_card(front, back):\n    pass\n\ndef study(deck):\n    pass\n",
        solution: "import random\n\ncards = []\n\ndef add_card(front, back):\n    cards.append({'front': front, 'back': back})\n    print(f'Card added! ({len(cards)} total)')\n\ndef study(deck):\n    if not deck:\n        print('No cards to study!')\n        return\n    shuffled = deck.copy()\n    random.shuffle(shuffled)\n    score = 0\n    for i, card in enumerate(shuffled):\n        print(f'\\nCard {i+1}/{len(shuffled)}')\n        print(f'Front: {card[\"front\"]}')\n        input('Press Enter to reveal...')\n        print(f'Back: {card[\"back\"]}')\n        got_it = input('Did you know it? (y/n): ')\n        if got_it.lower() == 'y':\n            score += 1\n    print(f'\\nScore: {score}/{len(shuffled)}')\n",
      },
      {
        title: "Build the main menu",
        description: "Create a menu with: Add card, Study all, View count, Quit.",
        hint: "Use a while True loop with input() for navigation.",
        solution: "def main():\n    while True:\n        print(f'\\n--- Flashcards ({len(cards)} cards) ---')\n        print('1. Add card')\n        print('2. Study')\n        print('3. Quit')\n        \n        choice = input('Choose: ')\n        if choice == '1':\n            front = input('Front (question): ')\n            back = input('Back (answer): ')\n            add_card(front, back)\n        elif choice == '2':\n            study(cards)\n        elif choice == '3':\n            break\n\nmain()\n",
      },
    ],
  },
];
