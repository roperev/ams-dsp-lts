import {
  loadHeader,
  loadFooter,
  // decorateButtons,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
  getMetadata,
} from './aem.js';

/**
 * Moves all the attributes from a given elmenet to another given element.
 * @param {Element} from the element to copy attributes from
 * @param {Element} to the element to copy attributes to
 */
export function moveAttributes(from, to, attributes) {
  if (!attributes) {
    // eslint-disable-next-line no-param-reassign
    attributes = [...from.attributes].map(({ nodeName }) => nodeName);
  }
  attributes.forEach((attr) => {
    const value = from.getAttribute(attr);
    if (value) {
      to.setAttribute(attr, value);
      from.removeAttribute(attr);
    }
  });
}

/**
 * Move instrumentation attributes from a given element to another given element.
 * @param {Element} from the element to copy attributes from
 * @param {Element} to the element to copy attributes to
 */
export function moveInstrumentation(from, to) {
  moveAttributes(
    from,
    to,
    [...from.attributes]
      .map(({ nodeName }) => nodeName)
      .filter((attr) => attr.startsWith('data-aue-') || attr.startsWith('data-richtext-')),
  );
}

let angleBracesReplaced = false; // prevent multiple runs

export function replaceAngleBracesWithSpan() {
  if (angleBracesReplaced) return;
  angleBracesReplaced = true;
  // process block-level elements where escaped angle braces might wrap HTML
  const textElements = document.querySelectorAll('p, li, h1, h2, h3, h4, h5, h6');
  const angleBraceRegex = /(?:<<|&lt;&lt;)([\s\S]*?)(?:>>|&gt;&gt;)/g;
  textElements.forEach((textElement) => {
    if (angleBraceRegex.test(textElement.innerHTML)) {
      textElement.innerHTML = textElement.innerHTML.replace(angleBraceRegex, '<span>$1</span>');
    }
  });
}

function decorateSectionAnchors(main) {
  main.querySelectorAll('.section[data-id]').forEach((section) => {
    const { id } = section.dataset;
    section.id = id;
  });
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks() {
  try {
    // TODO: add auto block, if needed
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  // hopefully forward compatible button decoration
  // decorateButtons(main);
  replaceAngleBracesWithSpan(main);
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
  decorateSectionAnchors(main);
}

function addOverlayRule(ruleSet, selector, property, value) {
  if (!ruleSet.has(selector)) {
    ruleSet.set(selector, [`--${property}: ${value};`]);
  } else {
    ruleSet.get(selector).push(`--${property}: ${value};`);
  }
}

/**
 * Helper for more concisely generating DOM Elements with attributes and children
 * @param {string} tag HTML tag of the desired element
 * @param  {[Object?, ...Element]} items: First item can optionally be an object of attributes,
 *  everything else is a child element
 * @returns {Element} The constructred DOM Element
 */
export function domEl(tag, ...items) {
  const element = document.createElement(tag);

  if (!items || items.length === 0) return element;

  if (!(items[0] instanceof Element || items[0] instanceof HTMLElement) && typeof items[0] === 'object') {
    const [attributes, ...rest] = items;
    // eslint-disable-next-line no-param-reassign
    items = rest;

    Object.entries(attributes).forEach(([key, value]) => {
      if (!key.startsWith('on')) {
        element.setAttribute(key, Array.isArray(value) ? value.join(' ') : value);
      } else {
        element.addEventListener(key.substring(2).toLowerCase(), value);
      }
    });
  }

  items.forEach((item) => {
    // eslint-disable-next-line no-param-reassign
    item = item instanceof Element || item instanceof HTMLElement
      ? item
      : document.createTextNode(item);
    element.appendChild(item);
  });

  return element;
}

export function div(...items) { return domEl('div', ...items); }
export function h4(...items) { return domEl('h4', ...items); }
export function h6(...items) { return domEl('h6', ...items); }
export function button(...items) { return domEl('button', ...items); }
export function p(...items) { return domEl('p', ...items); }
export function span(...items) { return domEl('span', ...items); }

export function createModal(document, title, message, buttons, legalNumber) {
  const main = document.querySelector('main');
  const container = div({ class: 'modal-container' });
  const modal = div({ class: 'modal' });
  const close = span({ class: 'modal-close' });
  const modalTitle = h4({ class: 'modal-title' });
  modalTitle.textContent = title;
  const modalMessage = h6({ class: 'modal-message' });
  modalMessage.textContent = message;
  const buttonsDiv = div({ class: 'modal-buttons' });
  buttons.forEach((b) => {
    if (b.name && b.action) {
      const bComponent = button({ class: `${b.class} modal-button` });
      bComponent.textContent = b.name;
      bComponent.addEventListener('click', b.action);
      buttonsDiv.append(bComponent);
    }
  });
  const modalLegalNumber = p({ class: 'modal-legal-number' });
  modalLegalNumber.textContent = legalNumber;

  close.addEventListener('click', (e) => {
    e.preventDefault();
    container.remove();
    document.querySelector('.background-dimmer')?.classList.remove('show');
  });

  modal.append(close, modalTitle, modalMessage, buttonsDiv, modalLegalNumber);
  container.append(modal);
  main.append(container);
}

async function loadThemeSpreadSheetConfig() {
  const theme = getMetadata('design');
  if (!theme) return;
  // make sure the json files are added to paths.json first
  const resp = await fetch(`/${theme}.json?offset=0&limit=500`);

  if (resp.status === 200) {
    // create style element that should be last in the head
    document.head.insertAdjacentHTML('beforeend', '<style id="style-overrides"></style>');
    const sheet = window.document.styleSheets[document.styleSheets.length - 1];
    // load spreadsheet
    const json = await resp.json();
    const tokens = json.data || json.default.data;
    // go through the entries and create the rule set
    const ruleSet = new Map();
    tokens.forEach((e) => {
      const {
        Property, Value, Section, Block,
      } = e;
      let selector = '';
      if (Section.length === 0 && Block.length === 0) {
        // :root { --<property>: <value>; }
        addOverlayRule(ruleSet, ':root', Property, Value);
      } else {
        // define the section selector if set
        if (Section.length > 0) {
          selector = `main .section.${Section}`;
        } else {
          selector = 'main .section';
        }
        // define the block selector if set
        if (Block.length) {
          Block.split(',').forEach((entry) => {
            // eslint-disable-next-line no-param-reassign
            entry = entry.trim();
            let blockSelector = selector;
            // special cases: default wrapper, text, image, button, title
            switch (entry) {
              case 'default':
                blockSelector += ' .default-content-wrapper';
                break;
              case 'image':
                blockSelector += ` .default-content-wrapper img, ${selector} .block.columns img`;
                break;
              case 'text':
                blockSelector += ` .default-content-wrapper p:not(:has(:is(a.button , picture))), ${selector} .columns.block p:not(:has(:is(a.button , picture)))`;
                break;
              case 'button':
                blockSelector += ' .default-content-wrapper a.button';
                break;
              case 'title':
                blockSelector += ` .default-content-wrapper :is(h1,h2,h3,h4,h5,h6), ${selector} .columns.block :is(h1,h2,h3,h4,h5,h6)`;
                break;
              default:
                blockSelector += ` .block.${entry}`;
            }
            // main .section.<section-name> .block.<block-name> { --<property>: <value>; }
            // or any of the spacial cases above
            addOverlayRule(ruleSet, blockSelector, Property, Value);
          });
        } else {
          // main .section.<section-name> { --<property>: <value>; }
          addOverlayRule(ruleSet, selector, Property, Value);
        }
      }
    });
    // finally write the rule sets to the style element
    ruleSet.forEach((rules, selector) => {
      sheet.insertRule(`${selector} {${rules.join(';')}}`, sheet.cssRules.length);
    });
  }
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  loadThemeSpreadSheetConfig();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadHeader(doc.querySelector('header'));
  loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
