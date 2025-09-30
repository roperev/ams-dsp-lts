// eslint-disable-next-line import/no-cycle
// import { loadScript } from './aem.js';

// commenting out customer scripts here but leaving as an example
/*
const launchDev = 'https://assets.adobedtm.com/acb96670c057/48663f28f53f/launch-e24016a2c101-development.min.js';
const launchProd = 'https://assets.adobedtm.com/acb96670c057/48663f28f53f/launch-450e00021d4f.min.js';
const oneTrustId = 'fab99249-4680-4892-8016-c1821d0ca04a';

// testing if we can call the script from adobe without affecting the page load performance
if (window.location.host.startsWith('localhost')) {
  await loadScript(launchDev);
} else if (window.location.host.startsWith('www.durystasavingsprogram.com') || window.location.host.endsWith('.live')) {
  await loadScript(launchProd);
} else if (window.location.host.endsWith('.page')) {
  await loadScript(launchDev);
}

if (oneTrustId) {
  loadScript('https://cdn.cookielaw.org/scripttemplates/otSDKStub.js', {
    type: 'text/javascript',
    charset: 'UTF-8',
    'data-domain-script': `${oneTrustId}`,
  });
}

const script = document.createElement('script');
script.src = `https://cdn.cookielaw.org/scripttemplates/otSDKStub.js?domain=${oneTrustId}`;
document.head.appendChild(script);
*/