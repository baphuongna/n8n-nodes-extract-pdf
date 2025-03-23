# n8n-nodes-extract-pdf

This n8n node extracts text from a PDF file.

## Description

The `n8n-nodes-extract-pdf` node is an n8n node that extracts text from a PDF file. It uses the `pdf-parse` library to parse the PDF and extract the text content.

## Installation

You can install the package from npm:

```bash
npm install n8n-nodes-extract-pdf
```

Alternatively, you can clone the repository and follow these steps:

1. Clone the repository:
   ```bash
   git clone https://github.com/baphuongna/n8n-nodes-extract-pdf.git
   ```

2. Navigate to the project directory:
   ```bash
   cd n8n-nodes-extract-pdf
   ```

3. Install the dependencies:
   ```bash
   npm install
   ```

4. Build the project:
   ```bash
   npm run build
   ```

5. Copy the compiled JavaScript file from the `dist` directory to your n8n nodes directory.

6. Restart n8n to load the new node.

## Usage

1. Install the package from npm:
   ```bash
   npm install n8n-nodes-extract-pdf
   ```

2. Add the `Extract PDF` node to your n8n workflow.
3. Configure the node to read a PDF file.
4. Run the workflow to extract text from the PDF file.

## Example

Here is an example of how to use the `Extract PDF` node in an n8n workflow:

1. Use the `File Reader` node to read a sample PDF file.
2. Use the `Extract PDF` node to extract text from the PDF file.
3. Use the `Set` node to store the extracted text.
4. Use the `Debug` node to output the extracted text.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

This project is licensed under the MIT License.
