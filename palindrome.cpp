#include <iostream>
#include <string>
#include <algorithm>
#include <cctype>

/**
 * Checks if a string is a palindrome.
 * A palindrome reads the same forwards and backwards (e.g., "racecar", "madam").
 * Ignores case and non-alphanumeric characters by default.
 */
bool isPalindrome(const std::string& str, bool ignoreCase = true, bool ignoreNonAlnum = true) {
    std::string cleaned;
    cleaned.reserve(str.size());

    for (char ch : str) {
        if (ignoreNonAlnum && !std::isalnum(static_cast<unsigned char>(ch))) {
            continue;
        }
        cleaned.push_back(ignoreCase ? std::tolower(static_cast<unsigned char>(ch)) : ch);
    }

    int left = 0;
    int right = static_cast<int>(cleaned.size()) - 1;

    while (left < right) {
        if (cleaned[left] != cleaned[right]) {
            return false;
        }
        ++left;
        --right;
    }

    return true;
}

int main(int argc, char* argv[]) {
    std::cout << "====================================\n";
    std::cout << "    PALINDROME CHECKER\n";
    std::cout << "====================================\n\n";

    if (argc > 1) {
        // Check strings passed as command-line arguments
        for (int i = 1; i < argc; ++i) {
            std::string input = argv[i];
            bool result = isPalindrome(input);
            std::cout << "\"" << input << "\" -> "
                      << (result ? "YES (is a palindrome)" : "NO (not a palindrome)")
                      << '\n';
        }
    } else {
        // Interactive mode
        std::cout << "Enter a string to check (or 'quit' to exit):\n\n";

        std::string input;
        while (true) {
            std::cout << "> ";
            std::getline(std::cin, input);

            if (input == "quit" || input == "exit") {
                std::cout << "\nGoodbye!\n";
                break;
            }

            bool result = isPalindrome(input);
            std::cout << "  \"" << input << "\"\n";
            std::cout << "  -> " << (result ? "YES, it's a palindrome!" : "NO, it's not a palindrome") << "\n\n";
        }
    }

    return 0;
}
