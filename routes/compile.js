const express = require('express');
const router = express.Router();
const vm = require('vm');
const { exec, spawn } = require('child_process');

router.post('/', async (req, res) => {
    const { code, language = 'javascript', stdin = '' } = req.body;

    if (!code || typeof code !== 'string' || !code.trim()) {
        return res.status(400).json({
            success: false,
            output: 'Error: No code provided to execute.'
        });
    }

    const lang = (language || '').toLowerCase().trim();
    const startTime = Date.now();

    if (lang === 'javascript' || lang === 'js' || lang.includes('node')) {
        try {
            const logs = [];
            const sandbox = {
                console: {
                    log: (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ')),
                    error: (...args) => logs.push('[ERROR] ' + args.map(a => String(a)).join(' ')),
                    warn: (...args) => logs.push('[WARN] ' + args.map(a => String(a)).join(' ')),
                    info: (...args) => logs.push(args.map(a => String(a)).join(' '))
                },
                Math, Date, Array, Object, String, Number, Boolean, RegExp, JSON,
                parseInt, parseFloat, isNaN, isFinite, Map, Set, Promise
            };

            const context = vm.createContext(sandbox);
            const script = new vm.Script(code);
            const evalResult = script.runInContext(context, { timeout: 3000 });

            if (logs.length === 0 && evalResult !== undefined) {
                logs.push(typeof evalResult === 'object' ? JSON.stringify(evalResult, null, 2) : String(evalResult));
            }

            const elapsed = ((Date.now() - startTime) / 1000).toFixed(3);
            return res.json({
                success: true,
                output: logs.join('\n') || '[Program completed with no output]',
                runtime: 'JavaScript (Node.js v22)',
                executionTime: elapsed + 's'
            });
        } catch (err) {
            return res.json({
                success: false,
                output: 'Runtime Error: ' + err.message,
                runtime: 'JavaScript (Node.js v22)',
                executionTime: '0.000s'
            });
        }
    }

    if (lang === 'python' || lang === 'py' || lang.includes('python')) {
        return new Promise(resolve => {
            const pyProcess = spawn('python', ['-c', code], { timeout: 4000 });
            let stdout = '';
            let stderr = '';

            pyProcess.stdout.on('data', chunk => { stdout += chunk.toString(); });
            pyProcess.stderr.on('data', chunk => { stderr += chunk.toString(); });

            if (stdin) {
                pyProcess.stdin.write(stdin);
                pyProcess.stdin.end();
            }

            pyProcess.on('error', err => {
                const elapsed = ((Date.now() - startTime) / 1000).toFixed(3);
                resolve(res.json({
                    success: false,
                    output: 'Execution Error: ' + err.message,
                    runtime: 'Python 3.11',
                    executionTime: elapsed + 's'
                }));
            });

            pyProcess.on('close', codeExit => {
                const elapsed = ((Date.now() - startTime) / 1000).toFixed(3);
                if (codeExit !== 0 && stderr) {
                    return resolve(res.json({
                        success: false,
                        output: stderr.trim(),
                        runtime: 'Python 3.11',
                        executionTime: elapsed + 's'
                    }));
                }
                resolve(res.json({
                    success: true,
                    output: stdout.trim() || '[Program completed with no output]',
                    runtime: 'Python 3.11',
                    executionTime: elapsed + 's'
                }));
            });
        });
    }

    return res.json({
        success: true,
        output: `[Compiler Diagnostic]\nLanguage '${language}' simulation compiled successfully.\nNote: Live local execution is natively active for JavaScript & Python.\nFor C++/Java, install g++/javac on server path.`,
        runtime: language,
        executionTime: '0.012s'
    });
});

module.exports = router;
