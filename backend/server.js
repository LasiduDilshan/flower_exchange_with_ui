const express = require('express');
const multer = require('multer');
const { exec } = require('child_process');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('cpp')); // Serve static files from 'cpp' directory

// File upload configuration
const upload = multer({ dest: 'cpp/' });

// Ensure the cpp directory exists
const cppDir = path.resolve(__dirname, 'cpp');
if (!fs.existsSync(cppDir)) {
    fs.mkdirSync(cppDir, { recursive: true });
}

// Process orders (calls C++ backend)
app.post('/process', upload.single('csvFile'), (req, res) => {
    const csvFilePath = path.resolve(cppDir, 'input.csv'); // Input file path in cpp directory

    // Rename the uploaded file to input.csv in the cpp directory
    try {
        fs.renameSync(req.file.path, csvFilePath);
        console.log('File renamed and moved to cpp folder.');

        // Compile the C++ program
        const compileCommand = `g++ -std=c++11 -pthread "${path.join(cppDir, 'Main.cpp')}" "${path.join(cppDir, 'Order.cpp')}" "${path.join(cppDir, 'OrderBook.cpp')}" -o "${path.join(cppDir, 'flower_exchange')}"`;

        console.log(`Running compile command: ${compileCommand}`);
        exec(compileCommand, { cwd: cppDir, shell: true }, (compileError, compileStdout, compileStderr) => {
            if (compileError) {
                console.error(`Error during compilation: ${compileError.message}`);
                console.error(`stderr: ${compileStderr}`);
                return res.status(500).json({ error: 'Failed to compile C++ code' });
            }

            console.log('Compilation successful. Running execution command:');
            
            // Run the compiled C++ program
            const executeCommand = `"${path.join(cppDir, 'flower_exchange')}" "${csvFilePath}"`;
            console.log(`Executing command: ${executeCommand}`);
            exec(executeCommand, { cwd: cppDir, shell: true }, (execError, execStdout, execStderr) => {
                if (execError) {
                    console.error(`Error during execution: ${execError.message}`);
                    console.error(`stderr: ${execStderr}`);
                    return res.status(500).json({ error: 'Failed to execute C++ code' });
                }

                // Log stdout and stderr from the C++ program
                console.log('C++ program output stdout:', execStdout);
                console.log('C++ program output stderr:', execStderr);

                // Check if the file exists in the cpp directory
                const outputPath = path.resolve(cppDir, 'execution_report_final.csv');
                if (!fs.existsSync(outputPath)) {
                    console.error('Output file not found at:', outputPath);
                    return res.status(500).json({ error: 'Output file not found' });
                }

                console.log('C++ program executed successfully.');
                // Send the processed file as response
                res.json({ message: 'Processing complete', outputFile: 'execution_report_final.csv' });
            });
        });
    } catch (err) {
        console.error('File processing error:', err);
        res.status(500).json({ error: 'Error during file processing' });
    }
});

// Serve the output file for frontend
app.get('/output', (req, res) => {
    const outputPath = path.resolve(cppDir, 'execution_report_final.csv');

    if (fs.existsSync(outputPath)) {
        res.download(outputPath);
    } else {
        res.status(404).json({ error: 'Output file not found' });
    }
});

// Start server
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));