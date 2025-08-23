import { handleBackspace, isPrintableKeyCode } from "../utils.js";

const prompt = ">> ";
const decoder = new TextDecoder("utf-8");

const simia = {
  id: "simia",
  args: 0,
  description: "simia lang REPL",
  process: true,
  loaded: false,

  async exec(term, _args, onProcessExit) {
    await this.start(term, onProcessExit);
  },

  async load(term) {
    const go = new Go();
    const res = await fetch("./wasm/simia.wasm");
    if (res.status !== 200) {
      throw new Error("couldn't load simia wasm: " + res.statusText);
    }

    const result = await WebAssembly.instantiateStreaming(res, go.importObject);
    // Redirect write to xterm
    let outputBuf = "";
    window.fs.writeSync = (fd, buf) => {
      outputBuf += decoder.decode(buf);
      const nl = outputBuf.lastIndexOf("\n");
      if (nl != -1) {
        term.writeln(outputBuf.substr(0, nl));
        outputBuf = outputBuf.substr(nl + 1);
      }
      return buf.length;
    };
    go.run(result.instance);
  },

  async start(term, onProcessExit) {
    let input = "";

    term.write("\x1b[2J");
    term.write("\x1b[0;0f");

    if (!this.loaded) {
      term.writeln("loading...");
      await this.load(term);
      this.loaded = true;
    }

    const listener = term.onKey(({ key, domEvent: ev }) => {
      switch (ev.key) {
        case "c": {
          if (ev.ctrlKey) {
            listener.dispose();
            term.write("\x1b[2J"); // clear screen
            term.write("\x1b[0;0f"); // move to home
            onProcessExit();
          }
          break;
        }

        case "Enter": {
          input = input.trim();
          if (input.length === 0) {
            input = "";
            term.write(prompt);
            return;
          }

          term.writeln("");
          const evaluated = window.simia(input);
          if (evaluated !== "" && evaluated !== "nil") {
            term.writeln(evaluated);
          }
          input = "";

          term.write(prompt);
          return;
        }

        case "Backspace": {
          input = handleBackspace(term, input);
          return;
        }
      }

      const hasModifier = ev.altKey || ev.altGraphKey || ev.ctrlKey || ev.metaKey;

      if (!hasModifier && isPrintableKeyCode(ev.keyCode)) {
        term.write(key);
        input += key;
      }
    });

    term.writeln("simia " + window.simia_version);
    term.writeln("docs: https://github.com/protiumx/simia");
    term.write(prompt);
  },
};

export default simia;
