const fs = require("fs");
const readline = require("readline");
const chalk = require("chalk");

const envExamplePath = ".env.example";
const envPath = ".env";

// Clear console at start
console.clear();

// Check if .env already exists
if (fs.existsSync(envPath)) {
  console.log(chalk.yellow("\n✅ .env file already exists. Skipping...\n"));
  process.exit(0);
}

// Check if .env.example exists
if (!fs.existsSync(envExamplePath)) {
  console.error(chalk.red("\n❌ Error: .env.example file not found.\n"));
  process.exit(1);
}

// Read and parse the .env.example file
const exampleContent = fs.readFileSync(envExamplePath, "utf-8");
const envLines = exampleContent.split("\n");

const envVars = [];
let currentComment = "";

for (const line of envLines) {
  const trimmedLine = line.trim();
  if (trimmedLine.startsWith("#")) {
    currentComment += trimmedLine.substring(1).trim() + " ";
  } else if (trimmedLine && trimmedLine.includes("=")) {
    const [name, defaultValue] = trimmedLine.split("=").map((part) => part.trim());
    envVars.push({
      name,
      description: currentComment.trim(),
      defaultValue: defaultValue || "",
      optional: currentComment.toLowerCase().includes("optional"),
    });
    currentComment = "";
  }
}

// Setup interactive prompt
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const envValues = {};

const askQuestion = (variable) => {
  return new Promise((resolve) => {
    let prompt = chalk.blue(`\n🔹 ${variable.name}`);

    if (variable.description) {
      prompt += chalk.gray(` (${variable.description})`);
    }

    if (variable.defaultValue) {
      prompt += chalk.green(` [default: ${variable.defaultValue}]`);
    }

    if (variable.optional) {
      prompt += chalk.yellow(" [Press Enter to skip]");
    }

    prompt += ": ";

    rl.question(prompt, (answer) => {
      envValues[variable.name] = answer || variable.defaultValue || "";
      resolve();
    });
  });
};

const main = async () => {
  console.log(chalk.magenta("\n🚀 Setting up your .env file...\n"));

  for (const variable of envVars) {
    await askQuestion(variable);
  }

  rl.close();

  const envContent = envVars
    .map((variable) => `${variable.name}=${envValues[variable.name]}`)
    .join("\n");

  fs.writeFileSync(envPath, envContent);
  console.log(chalk.green("\n✅ .env file created successfully!\n"));
  
  // Wait a moment to show the success message
  await new Promise(r => setTimeout(r, 1000));
  
  // Thorough console clearing with multiple approaches
  await console.clear();
  
  process.exit(0);
};

main();
