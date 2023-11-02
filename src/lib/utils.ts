import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const generateDepartmentName = () => {
  const amphibians = [
    "Frog",
    "Crocodile",
    "Alligator",
    "Monitor-lizard",
    "Salamander",
    "Toad",
    "Newt",
    "Iguana",
    "Snake",
    "Green-dragon-lizard",
    "Snake",
  ];

  const mammals = [
    "Lion",
    "Tiger",
    "Goat",
    "Horse",
    "Donkey",
    "Dog",
    "Cat",
    "Pig",
    "Panther",
    "Leopard",
    "Cheetah",
    "Cow",
    "Walrus",
    "Otter",
    "Giraffe",
    "Sheep",
    "Rabbit",
    "Monkey",
  ];

  const fishs = [
    "Herring",
    "Crab",
    "Brill",
    "Haddock",
    "Eel",
    "Whale",
    "Blue-whale",
    "Salmon",
    "Sardines",
    "Pike",
    "Carp",
    "Shark",
    "Tuna",
    "Pufferfish",
    "Blue-tang",
  ];

  const name1 = amphibians.at(Math.floor(Math.random() * amphibians.length));
  const name2 = mammals.at(Math.floor(Math.random() * amphibians.length));
  const name3 = fishs.at(Math.floor(Math.random() * amphibians.length));

  const departmentName = `${name1} ${name2} ${name3}`;
  if (!departmentName) throw new Error("No department name found");

  return departmentName;
};

export const generateProgrammingLanguage = () => {
  const languages = [
    "Python",
    "Java",
    "JavaScript",
    "C#",
    "C++",
    "PHP",
    "TypeScript",
    "Ruby",
    "Swift",
    "Kotlin",
    "Go",
    "R",
  ];

  const language = languages.at(Math.floor(Math.random() * languages.length));
  if (!language) throw new Error("No language found");

  return language;
};
