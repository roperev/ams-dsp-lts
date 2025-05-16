/* eslint-disable no-console */
// import setAttributes from '../../scripts/set-attributes.js';
// import { trackInteraction } from '../../scripts/datalayer.js';
import {
  decorateMain,
} from '../../scripts/scripts.js';
import {
  loadSections,
} from '../../scripts/aem.js';

const BLOCK_CLASS = 'isi';
// const BLOCK_ID = 'isi';
const BLOCK_EXPAND_TEXT = 'expand';
const BLOCK_COLLAPSE_TEXT = 'hide';
// const BLOCK_EXPANDER_DEFAULT_OPEN = false;
const HOOK = '#inline-isi';

/**
 * Define an IntersectionObserver for the block
 * @param {HTMLElement} block - element to change
 * @param {string}      hook  - class of the observed target
 */
function io(block, hook) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      block.classList.toggle(
        `is-page-${BLOCK_CLASS}-visible`,
        entry.isIntersecting,
      );
    });
  });

  observer.observe(hook);
}

// /**
//  * Set the expander
//  * @param {HTMLElement} contentContainer  - content element used for ARIA
//  * @returns {HTMLElement}                 - expander button
//  */
// function setExpander(contentContainer) {
//   let isOpen = BLOCK_EXPANDER_DEFAULT_OPEN;
//   console.log('inside setExpander', contentContainer);
//   const handleToggler = (e) => {
//     // trackInteraction(e.currentTarget);
//     // isOpen = !isOpen;

//     console.log('isOpen', isOpen);
//     e.currentTarget.querySelector(`.${BLOCK_CLASS}-expand-button`).innerText = isOpen
//       ? BLOCK_COLLAPSE_TEXT
//       : BLOCK_EXPAND_TEXT;
//     e.currentTarget.setAttribute('aria-expanded', isOpen);

//     console.log('e.currentTarget', e.currentTarget);
//     contentContainer.setAttribute('aria-hidden', !isOpen);
//   };

//   // setAttributes(contentContainer, {
//   //   id: `${BLOCK_CLASS}-content`,
//   //   role: 'region',
//   //   'aria-labelledby': title.id,
//   //   'aria-hidden': !isOpen,
//   // });

//   const buttonElement = document.createElement('button');
//   buttonElement.type = 'button';
//   buttonElement.className = `${BLOCK_CLASS}-toggle`;
//   buttonElement.setAttribute('aria-label', BLOCK_EXPAND_TEXT);
//   buttonElement.setAttribute('aria-expanded', true);
//   buttonElement.setAttribute('aria-controls', contentContainer.id);
//   buttonElement.addEventListener('click', handleToggler);

//   const spanElement = document.createElement('span');
//   spanElement.className = `${BLOCK_CLASS}-toggle-label`;
//   spanElement.innerText = BLOCK_EXPANDER_DEFAULT_OPEN ? BLOCK_COLLAPSE_TEXT : BLOCK_EXPAND_TEXT;
//   buttonElement.appendChild(spanElement);

//   return buttonElement;
// }

/**
 * Loads a fragment.
 * @param {string} path The path to the fragment
 * @returns {HTMLElement} The root element of the fragment
 */
export async function loadFragment(path) {
  if (path && path.startsWith('/')) {
    // eslint-disable-next-line no-param-reassign
    path = path.replace(/(\.plain)?\.html/, '');
    const resp = await fetch(`${path}.plain.html`);
    if (resp.ok) {
      const main = document.createElement('main');
      main.innerHTML = await resp.text();

      // reset base path for media to fragment base
      const resetAttributeBase = (tag, attr) => {
        main.querySelectorAll(`${tag}[${attr}^="./media_"]`).forEach((elem) => {
          elem[attr] = new URL(elem.getAttribute(attr), new URL(path, window.location)).href;
        });
      };
      resetAttributeBase('img', 'src');
      resetAttributeBase('source', 'srcset');

      decorateMain(main);
      await loadSections(main);
      return main;
    }
  }
  return null;
}

/**
 * Renders / decorates the block
 * @param {HTMLElement} block - component block
 */
function render(block) {
  const contentContainer = block.closest('.isi-container');
  console.log('contentContainer', contentContainer);
  const contentWrap = contentContainer.querySelector(':scope > div');
  console.log('contentWrap', contentWrap);
  // const isiInSnackbar = document.querySelector('#isi-snackbar');
  // console.log('isiInSnackbar', isiInSnackbar);

  // // button setup
  // let expanderButton = null;
  // if (isiInSnackbar) {
  //   expanderButton = setExpander(contentContainer);
  //   console.log('expanderButton', expanderButton);
  //   // contentWrap.append(expanderButton);
  // }

  // Turn the below 3 lines back on
  // contentContainer.classList.add(`${BLOCK_CLASS}-content-container`);
  // contentContainer.id = `${BLOCK_CLASS}-content-container`;
  contentWrap.classList.add(`${BLOCK_CLASS}-content-wrap`);
}

/**
 * Toggles the "isi-wrapper" div as a popup snackbar
 */
function toggleISIPopup() {
  const isiSnackbar = document.querySelector('#isi-snackbar');
  if (!isiSnackbar) {
    console.error('Element with id "isi-snackbar" not found.');
    return;
  }
  console.log('isiSnackbar', isiSnackbar);

  const isiWrapper = isiSnackbar.querySelector(':scope > .isi-wrapper');
  if (!isiWrapper) {
    console.error('Element inside fragment with class "isi-wrapper" not found.');
    return;
  }
  console.log('isiWrapper', isiWrapper);

  // Initial wrapper setup (remove later if possible)
  isiSnackbar.classList.add('isi-wrapper-initial');

  // Add a toggle button
  const toggleButtonDiv = document.createElement('div');
  toggleButtonDiv.id = 'isi-toggle-button-div';
  console.log('toggleButtonDiv', toggleButtonDiv);

  const toggleButton = document.createElement('button');
  toggleButton.innerText = 'Expand';
  toggleButton.classList.add('isi-expand-button', 'isi-toggle-button-initial');
  toggleButton.setAttribute('aria-label', BLOCK_EXPAND_TEXT);
  toggleButton.setAttribute('aria-expanded', false);
  toggleButton.setAttribute('aria-controls', isiSnackbar.id);

  let isExpanded = false;
  const toggleHeight = () => {
    isExpanded = !isExpanded;
    console.log('isExpanded inside of toggleHeight', isExpanded);
    // isiSnackbar.style.height = isExpanded ? 'calc(100% - 185px)' : '300px';
    // document.querySelector('.hero-container').classList.toggle('dim', isExpanded);
    document.querySelector('body').classList.toggle('dim', isExpanded);
    isiSnackbar.classList.toggle('is-isi-visible', isExpanded);
    isiWrapper.classList.toggle('is-isi-visible', isExpanded);
    toggleButton.classList.toggle('is-isi-visible', isExpanded);
    toggleButton.innerText = isExpanded ? BLOCK_COLLAPSE_TEXT : BLOCK_EXPAND_TEXT;

    // handle aria attributes
    let ariaLabel = BLOCK_EXPAND_TEXT;
    ariaLabel = isExpanded ? BLOCK_COLLAPSE_TEXT : BLOCK_EXPAND_TEXT;
    toggleButton.setAttribute('aria-label', ariaLabel);
    toggleButton.setAttribute('aria-expanded', isExpanded);
  };
  toggleButton.addEventListener('click', toggleHeight);

  toggleButtonDiv.appendChild(toggleButton);
  isiSnackbar.firstElementChild.appendChild(toggleButtonDiv);
}

// Call the function to initialize the popup
toggleISIPopup();

export default async function decorate(block) {
  const hook = document.querySelector(HOOK);
  console.log('hook', hook);

  // don't do anything if the hook element is missing
  // if (!hook) return;
  const link = block.querySelector('a');
  const path = link ? link.getAttribute('href') : block.textContent.trim();
  const fragment = await loadFragment(path);
  if (fragment) {
    const fragmentSection = fragment.querySelector(':scope .section');
    if (fragmentSection) {
      console.log('fragmentSection', fragmentSection);
      block.classList.add(...fragmentSection.classList);
      block.classList.remove('section');
      // replace everything in the block with the fragment
      block.replaceChildren(...fragmentSection.childNodes);
      // OR just add the fragment section to the block
      // block.append(...fragmentSection.childNodes);
    }
  }
  render(block);
  const blockParent = block.parentElement;
  io(blockParent, hook);
}
