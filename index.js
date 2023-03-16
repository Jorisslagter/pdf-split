const fs = require("fs");
const { PDFDocument } = require("pdf-lib");
const inquirer = require("inquirer");

async function promptUser() {
  // vraag de gebruiker om een keuze
  const answer = await inquirer.prompt([
    {
      type: "list",
      name: "action",
      message: "Wat wil je doen?",
      choices: [
        { name: "Split PDF", value: "split" },
        { name: "Stoppen", value: "stop" },
      ],
    },
  ]);

  // als de gebruiker kiest om te stoppen, stop dan het script
  if (answer.action === "stop") {
    console.log("Tot ziens!");
    return;
  }

  // als de gebruiker kiest om PDF's te splitsen, vraag dan om een bestandsnaam
  const pdfFiles = fs
    .readdirSync(process.cwd())
    .filter((filename) => filename.toLowerCase().endsWith(".pdf"));

  // als er geen PDF-bestanden zijn gevonden, toon dan een foutmelding en stop het script
  if (pdfFiles.length === 0) {
    console.error("Er zijn geen PDF-bestanden gevonden in de huidige map.");
    return;
  }

  // maak een lijst met keuzes voor de prompt
  const choices = pdfFiles.map((filename) => ({
    name: filename,
    value: filename,
  }));

  // vraag de gebruiker om een bestandsnaam
  const answer2 = await inquirer.prompt([
    {
      type: "list",
      name: "filename",
      message: "Kies een PDF-bestand om op te splitsen:",
      choices,
    },
  ]);

  // splits de PDF
  await splitPDF(answer2.filename);

  // herstart de prompt
  await promptUser();
}

async function splitPDF(filename) {
  // lees het PDF-bestand in
  const pdfBytes = fs.readFileSync(filename);

  // laad het PDF-bestand in het geheugen
  const pdfDoc = await PDFDocument.load(pdfBytes);

  // haal het aantal pagina's in het document op
  const numPages = pdfDoc.getPageCount();

  // genereer een unieke mapnaam op basis van de bestandsnaam en de huidige datum en tijd
  const baseFilename = filename.replace(".pdf", "");
  const folderName = `${baseFilename} - ${new Date()
    .toISOString()
    .replace(/:/g, "-")}`;
  fs.mkdirSync(folderName);

  // loop door elke pagina in het document
  for (let i = 0; i < numPages; i++) {
    // maak een nieuw PDF-document met alleen deze pagina
    const newDoc = await PDFDocument.create({ preservePDFEmbedding: true });

    const [copiedPage] = await newDoc.copyPages(pdfDoc, [i]);
    newDoc.addPage(copiedPage);

    // schrijf het nieuwe PDF-document naar een bestand
    const pageNumber = i + 1;
    const pageFilename = `${folderName}/${baseFilename} - Page ${pageNumber} - ${new Date()
      .toISOString()
      .replace(/:/g, "-")}.pdf`;
    const pdfBytes = await newDoc.save();
    fs.writeFileSync(pageFilename, pdfBytes);
  }

  console.log("Done!");
}

// start het script
promptUser();
