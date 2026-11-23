export const ODS_MIME_TYPE = "application/vnd.oasis.opendocument.spreadsheet";

const OFFICE_NS = "urn:oasis:names:tc:opendocument:xmlns:office:1.0";
const TABLE_NS = "urn:oasis:names:tc:opendocument:xmlns:table:1.0";
const TEXT_NS = "urn:oasis:names:tc:opendocument:xmlns:text:1.0";
const STYLE_NS = "urn:oasis:names:tc:opendocument:xmlns:style:1.0";
const FO_NS = "urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0";
const MANIFEST_NS = "urn:oasis:names:tc:opendocument:xmlns:manifest:1.0";
const XML_DECLARATION = '<?xml version="1.0" encoding="UTF-8"?>';
const OFFICE_ATTRIBUTES = `xmlns:office="${OFFICE_NS}" office:version="1.4"`;
const COLUMN_WIDTHS = {
  Title: "8.317cm",
  Platform: "2.36cm",
  Edition: "8.28cm",
  Media: "2.572cm",
  Status: "7.281cm",
  Result: "0.497cm",
  Spacing: "2.258cm",
  Missing: "1.752cm",
  Ok: "0.88cm",
  Total: "1.097cm",
  StatusSummary: "6.927cm",
};

const STATUS_STYLES = {
  "#81d41a": "StatusGreen",
  "#ff0000": "StatusRed",
  "#ff8000": "StatusOrange",
  "#ffff00": "StatusYellow",
};

export function normalizeStatusColor(value) {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) ? value.toLowerCase() : null;
}

export function defaultStatusColor(status) {
  if (status === "OK") return "#81d41a";
  if (["Uscito fuori", "Non reperibile", "ROM Mac non reperibile", "In abbonamento"].includes(status)) return "#ff0000";
  if ([
    "Da studiare estrazione e comprare", "Da comprare e dumpare per la prima volta",
    "Remake da comprare non ben emulabile", "Windows 95 da comprare", "Porting limitato",
  ].includes(status)) return "#ff8000";
  return status ? "#ffff00" : null;
}

export function getVariantStatusColor(variant) {
  return normalizeStatusColor(variant.statusColor) ?? defaultStatusColor(variant.stato);
}

function escapeXml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function escapeAttribute(value) {
  return escapeXml(value).replaceAll('"', "&quot;");
}

function serializeCell(cell) {
  const { value, style, formula, span, matrixRows, covered } =
    typeof cell === "object" ? cell : { value: cell };
  const styleAttribute = style ? ` table:style-name="${style}"` : "";
  if (covered) return `<table:covered-table-cell${styleAttribute}/>`;
  const attributes = styleAttribute +
    (span ? ` table:number-columns-spanned="1" table:number-rows-spanned="${span}"` : "") +
    (matrixRows ? ` table:number-matrix-columns-spanned="1" table:number-matrix-rows-spanned="${matrixRows}"` : "") +
    (formula ? ` table:formula="${escapeAttribute(`of:=${formula}`)}"` : "");
  if (typeof value === "number") {
    return `<table:table-cell${attributes} office:value-type="float" office:value="${value}"><text:p>${value}</text:p></table:table-cell>`;
  }

  if (/[^\u0009\u000A\u000D\u0020-\uD7FF\uE000-\uFFFD\u{10000}-\u{10FFFF}]/u.test(value)) {
    throw new Error("L’archivio contiene caratteri non supportati dal formato ODS.");
  }
  const text = escapeXml(value)
    .replace(/ {2,}|\t|\r\n?|\n/g, (whitespace) => {
      if (whitespace === "\t") return "<text:tab/>";
      if (whitespace.startsWith(" ")) return `<text:s text:c="${whitespace.length}"/>`;
      return "<text:line-break/>";
    });
  const cache = formula ? ` office:string-value="${escapeAttribute(value)}"` : "";
  return `<table:table-cell${attributes} office:value-type="string"${cache}><text:p>${text}</text:p></table:table-cell>`;
}

function serializeSheet(name, columnStyles, rows) {
  const columns = columnStyles.map((style) => `<table:table-column table:style-name="${style}"/>`).join("");
  const body = rows.map((row) => `<table:table-row>${row.map(serializeCell).join("")}</table:table-row>`).join("");
  return `<table:table table:name="${name}">${columns}${body}</table:table>`;
}

function buildAutomaticStyles(statusColors) {
  const columns = Object.entries(COLUMN_WIDTHS).map(([name, width]) =>
    `<style:style style:name="${name}" style:family="table-column"><style:table-column-properties style:column-width="${width}"/></style:style>`,
  ).join("");
  const statusStyles = [...statusColors].map(([color, name]) =>
    `<style:style style:name="${name}" style:family="table-cell"><style:table-cell-properties fo:background-color="${color}"/></style:style>`,
  ).join("");
  return `<office:automatic-styles>${columns}${statusStyles}
    <style:style style:name="Grouped" style:family="table-cell">
      <style:table-cell-properties style:text-align-source="fix" style:vertical-align="middle"/>
      <style:paragraph-properties fo:text-align="center"/>
    </style:style>
    <style:style style:name="ResultTitle" style:family="table-cell">
      <style:map style:condition="is-true-formula([.B1]=&quot;-&quot;)" style:apply-style-name="Bad" style:base-cell-address="Risultati.A1"/>
      <style:map style:condition="is-true-formula([.B1]=&quot;x&quot;)" style:apply-style-name="Good" style:base-cell-address="Risultati.A1"/>
    </style:style>
    <style:style style:name="ResultValue" style:family="table-cell">
      <style:map style:condition="cell-content()=&quot;-&quot;" style:apply-style-name="Bad" style:base-cell-address="Risultati.B1"/>
      <style:map style:condition="cell-content()=&quot;x&quot;" style:apply-style-name="Good" style:base-cell-address="Risultati.B1"/>
    </style:style>
  </office:automatic-styles>`;
}

function groupedCell(value, span) {
  return { value, style: "Grouped", span: span > 1 ? span : undefined };
}

function platformCells(variants) {
  const cells = [];
  for (let start = 0; start < variants.length;) {
    const { piattaforma } = variants[start];
    let end = start + 1;
    while (piattaforma && end < variants.length &&
      variants[end].piattaforma === piattaforma && !variants[end].separatePlatform) end += 1;
    cells.push(groupedCell(piattaforma, end - start));
    for (let index = start + 1; index < end; index += 1) {
      cells.push({ covered: true, style: "Grouped" });
    }
    start = end;
  }
  return cells;
}

function uniqueFormula(range) {
  const unique = `COM.MICROSOFT.UNIQUE(${range})`;
  return `COM.MICROSOFT.FILTER(${unique};${unique}<>"";"")`;
}

function sheetRange(sheet, column, lastRow) {
  return `[$${sheet}.$${column}$1:$${column}$${lastRow}]`;
}

function listaGroups(titles) {
  // A title can occur in disjoint blocks in the reference, while the app
  // represents it as a single record. Use the import order when available.
  const rows = titles.flatMap(({ titolo, sottoVarianti }) =>
    sottoVarianti.map((variant) => ({ titolo, variant })),
  );
  if (rows.some(({ variant }) => variant.sourceRow !== undefined)) {
    const position = ({ variant }) => variant.sourceRow ?? Number.MAX_SAFE_INTEGER;
    rows.sort((left, right) => position(left) - position(right));
  }
  const groups = [];
  for (const { titolo, variant } of rows) {
    if (groups.at(-1)?.titolo !== titolo) groups.push({ titolo, sottoVarianti: [] });
    groups.at(-1).sottoVarianti.push(variant);
  }
  return groups;
}

function buildContentXml(titles) {
  const lista = [];
  const appoggio = [];
  const classifications = [];
  const statusCounts = new Map();
  const statusColors = new Map();
  let okCount = 0;

  for (const { titolo, sottoVarianti } of listaGroups(titles)) {
    const platforms = platformCells(sottoVarianti);
    sottoVarianti.forEach((variant, index) => {
      const { edizioneVersione, supporto, stato } = variant;
      const row = lista.length + 1;
      const color = getVariantStatusColor(variant);
      const statusStyle = color ? STATUS_STYLES[color] ?? `Status_${color.slice(1)}` : undefined;
      if (color) statusColors.set(color, statusStyle);
      lista.push([
        index === 0 ? groupedCell(titolo, sottoVarianti.length) : { covered: true, style: "Grouped" },
        platforms[index], edizioneVersione, supporto, { value: stato, style: statusStyle },
      ]);
      const titleRef = `[$Lista.A${row}]`;
      const statusRef = `[$Lista.E${row}]`;
      appoggio.push([
        { value: titolo, formula: row === 1 ? titleRef : `IF(${titleRef}="";[.$A${row - 1}];${titleRef})` },
        { value: stato, formula: `IF(${statusRef}="";"";${statusRef})` },
      ]);
      if (stato) statusCounts.set(stato, (statusCounts.get(stato) || 0) + 1);
    });
  }

  for (const { sottoVarianti } of titles) {
    const isOk = sottoVarianti.some(({ stato }) => stato === "OK") ||
      sottoVarianti.every(({ stato }) => stato === "Uscito fuori" || stato === "Non reperibile");
    classifications.push(isOk ? "x" : "-");
    if (isOk) okCount += 1;
  }

  const titleRange = sheetRange("Appoggio", "A", appoggio.length);
  const stateRange = sheetRange("Appoggio", "B", appoggio.length);
  const rawStates = sheetRange("Lista", "E", lista.length);
  const rawTitles = sheetRange("Lista", "A", lista.length);
  const statuses = [...statusCounts];
  const risultati = Array.from({ length: Math.max(2, titles.length, statuses.length + 1) }, (_, index) => {
    const row = index + 1;
    const cells = Array(9).fill("");
    if (index < titles.length) {
      const criteria = `"="&[.A${row}]`;
      const count = (status) => `COUNTIFS(${titleRange};${criteria};${stateRange};"${status}")`;
      cells[0] = { value: titles[index].titolo, style: "ResultTitle" };
      if (!index) Object.assign(cells[0], { formula: uniqueFormula(rawTitles), matrixRows: titles.length });
      cells[1] = {
        value: classifications[index], style: "ResultValue",
        formula: `IF(OR(${count("OK")}>0;COUNTIF(${titleRange};${criteria})<=${count("Uscito fuori")}+${count("Non reperibile")});"x";"-")`,
      };
    }
    if (index === 0) {
      [cells[3], cells[4], cells[5], cells[8]] = ["Mancanti", "Ok", "Total", "Total"];
    } else if (index === 1) {
      cells[3] = { value: titles.length - okCount, formula: `COUNTIF([.B1:.B${titles.length}];"-")` };
      cells[4] = { value: okCount, formula: `COUNTIF([.B1:.B${titles.length}];"x")` };
      cells[5] = { value: titles.length, formula: "SUM([.D2:.E2])" };
    }
    if (index > 0 && index <= statuses.length) {
      const [status, count] = statuses[index - 1];
      cells[7] = index === 1 ? { value: status, formula: uniqueFormula(rawStates), matrixRows: statuses.length } : status;
      cells[8] = { value: count, formula: `COUNTIF(${rawStates};"="&[.H${row}])` };
    }
    return cells;
  });
  const sheets = [
    serializeSheet("Lista", ["Title", "Platform", "Edition", "Media", "Status"], lista),
    serializeSheet("Risultati", ["Title", "Result", "Spacing", "Missing", "Ok", "Total", "Spacing", "StatusSummary", "Spacing"], risultati),
    serializeSheet("Appoggio", ["Title", "StatusSummary"], appoggio),
  ].join("");
  return `${XML_DECLARATION}
<office:document-content ${OFFICE_ATTRIBUTES} xmlns:table="${TABLE_NS}" xmlns:text="${TEXT_NS}" xmlns:style="${STYLE_NS}" xmlns:fo="${FO_NS}" xmlns:of="urn:oasis:names:tc:opendocument:xmlns:of:1.2">
  ${buildAutomaticStyles(statusColors)}
  <office:body><office:spreadsheet>
    <table:calculation-settings table:case-sensitive="true" table:search-criteria-must-apply-to-whole-cell="true" table:use-regular-expressions="false" table:use-wildcards="false"/>
    ${sheets}
  </office:spreadsheet></office:body>
</office:document-content>`;
}

function buildStylesXml() {
  return `${XML_DECLARATION}
<office:document-styles ${OFFICE_ATTRIBUTES} xmlns:style="${STYLE_NS}" xmlns:fo="${FO_NS}">
  <office:styles>
    <style:style style:name="Good" style:family="table-cell">
      <style:table-cell-properties fo:background-color="#ccffcc"/>
      <style:text-properties fo:color="#006600"/>
    </style:style>
    <style:style style:name="Bad" style:family="table-cell">
      <style:table-cell-properties fo:background-color="#ffcccc"/>
      <style:text-properties fo:color="#cc0000"/>
    </style:style>
  </office:styles>
</office:document-styles>`;
}

const CRC_TABLE = Uint32Array.from({ length: 256 }, (_, value) => {
  for (let bit = 0; bit < 8; bit += 1) {
    value = (value >>> 1) ^ ((value & 1) ? 0xedb88320 : 0);
  }
  return value;
});

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ byte) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// ODS requires mimetype to be the first ZIP entry, uncompressed and without
// extra fields. Store the XML entries the same way to avoid a runtime dependency.
function buildStoredZip(entries) {
  const encoder = new TextEncoder();
  const files = [];
  const directory = [];
  let offset = 0;
  let directorySize = 0;

  for (const [name, content] of entries) {
    const fileName = encoder.encode(name);
    const bytes = encoder.encode(content);
    const crc = crc32(bytes);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(12, 33, true); // ZIP date: 1980-01-01
    local.setUint32(14, crc, true);
    local.setUint32(18, bytes.length, true);
    local.setUint32(22, bytes.length, true);
    local.setUint16(26, fileName.length, true);

    const central = new DataView(new ArrayBuffer(46));
    central.setUint32(0, 0x02014b50, true);
    central.setUint16(4, 20, true);
    new Uint8Array(central.buffer, 6, 26).set(new Uint8Array(local.buffer, 4, 26));
    central.setUint32(42, offset, true);

    files.push(local.buffer, fileName, bytes);
    directory.push(central.buffer, fileName);
    offset += local.byteLength + fileName.length + bytes.length;
    directorySize += central.byteLength + fileName.length;
  }

  if (offset + directorySize + 22 >= 0xffffffff) {
    throw new Error("L’archivio è troppo grande per essere esportato.");
  }
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, entries.length, true);
  end.setUint16(10, entries.length, true);
  end.setUint32(12, directorySize, true);
  end.setUint32(16, offset, true);

  return new Blob([...files, ...directory, end.buffer], { type: ODS_MIME_TYPE });
}

export function buildOperationalODS(titles) {
  if (!titles.length) {
    throw new Error("Non ci sono dati da esportare.");
  }

  const documents = [
    ["content.xml", buildContentXml(titles)],
    ["styles.xml", buildStylesXml()],
    ["meta.xml", `${XML_DECLARATION}<office:document-meta ${OFFICE_ATTRIBUTES}><office:meta/></office:document-meta>`],
  ];
  const manifest = `${XML_DECLARATION}
<manifest:manifest xmlns:manifest="${MANIFEST_NS}" manifest:version="1.4">
  <manifest:file-entry manifest:full-path="/" manifest:media-type="${ODS_MIME_TYPE}" manifest:version="1.4"/>
  ${documents.map(([name]) => `<manifest:file-entry manifest:full-path="${name}" manifest:media-type="text/xml"/>`).join("")}
</manifest:manifest>`;

  return buildStoredZip([
    ["mimetype", ODS_MIME_TYPE],
    ["META-INF/manifest.xml", manifest],
    ...documents,
  ]);
}
