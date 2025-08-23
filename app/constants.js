// Octal codes are not allowed in strict mode.
// Hence the hexadecimal escape sequence
export const TermColors = {
  Red: "\x1b[1;31m",
  Green: "\x1b[1;32m",
  Purple: "\x1b[1;35m",
  Reset: "\x1b[0m",
};

export const SHELL_PROMPT =
  TermColors.Purple + "anonymous:~$ " + TermColors.Reset;

export const HistorySize = 100;
