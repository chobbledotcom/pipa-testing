import { join } from "node:path";
import { prep } from "./prepare-dev.js";
import { bun, path, read } from "./utils.js";

const dev = path(".build", "dev");
const output = join(dev, "_site");

const pages = [
  "index.html",
  "about/index.html",
  "contact/index.html",
  "equipment-sales/index.html",
  "inflatable-repairs/index.html",
  "pipa-testing/index.html",
  "rpii-courses/index.html",
  "safety/index.html",
  "standard-test/index.html",
  "testing/index.html",
  "thank-you/index.html",
  "bunnycdn_errors/404.html",
];

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const validateHeading = async (relativePath) => {
  const html = await read(join(output, relativePath));
  const headings = html.match(/<h[1-6](?:\s|>)/g) ?? [];
  const h1s = html.match(/<h1(?:\s|>)/g) ?? [];

  assert(
    headings[0]?.startsWith("<h1"),
    `${relativePath} must start with an h1`,
  );
  assert(h1s.length === 1, `${relativePath} must contain exactly one h1`);
  assert(
    !html.includes("{{ site."),
    `${relativePath} contains unresolved site data`,
  );

  return html;
};

prep();

console.log("Building site for smoke tests...");
const result = bun.run("build", dev);
if (result.exitCode !== 0) process.exit(result.exitCode);

const htmlPages = await Promise.all(pages.map(validateHeading));
const home = htmlPages[0];
const contact = htmlPages[2];
const testing = htmlPages[9];
const contactForm = JSON.parse(
  await read(join(dev, "src", "_data", "contact-form.json")),
);

assert(
  home.includes('class="service-grid"'),
  "Homepage service grid is missing",
);
assert(
  home.includes("Testing at a glance"),
  "Homepage pricing summary is missing",
);
assert(
  testing.includes("Which test do I need?"),
  "Testing comparison is missing",
);
assert(testing.includes("PIPA testing"), "PIPA testing choice is missing");
assert(
  testing.includes("Standard testing"),
  "Standard testing choice is missing",
);
assert(contact.includes('id="enquiry-form"'), "Contact form anchor is missing");
assert(home.includes('class="footer-grid"'), "Footer content is missing");
assert(
  contactForm.fields.some(({ name }) => name === "enquiry_type"),
  "Contact form enquiry type is missing",
);

console.log(`Site smoke tests passed for ${pages.length} pages.`);
