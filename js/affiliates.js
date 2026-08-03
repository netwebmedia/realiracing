/* ============================================================
 * RealIRacing — affiliate config (single source of truth)
 * ============================================================
 * All affiliate product data lives HERE and only here.
 *
 * To activate Amazon Associates: replace 'PENDING-20' below with
 * the real tracking ID (e.g. 'realiracing-20'). One-line swap —
 * every link on the site picks it up. While the tag is still
 * 'PENDING-20', links go out untagged and work normally.
 *
 * Usage in a page:
 *   <div id="rir-gear"></div>
 *   ...
 *   <script src="/js/affiliates.js"></script>
 *   <script>renderGearBox('rir-gear', ['moza-r9','moza-cs-v2'], 'Optional box title');</script>
 *
 * Or hydrate static anchors:  <a data-aff="moza-r9">MOZA R9</a>
 *   <script>RIR_AFF.hydrateLinks();</script>
 * ============================================================ */
(function (global) {
  'use strict';

  var RIR_AFF = {
    amazonTag: 'realiracing-20',

    products: {

      /* ── The actual rig (what Carlos races on) ────────────── */
      'moza-r9': {
        name: 'MOZA R9 Direct Drive Wheelbase',
        amazonUrl: 'https://www.amazon.com/s?k=MOZA+R9+direct+drive+wheel+base',
        note: '9 N·m direct drive — the base bolted to my rig right now'
      },
      'moza-cs-v2': {
        name: 'MOZA CS V2 Steering Wheel',
        amazonUrl: 'https://www.amazon.com/s?k=MOZA+CS+V2+steering+wheel',
        note: 'the round rim my whole FFB profile is tuned around'
      },
      'moza-crp2': {
        name: 'MOZA CRP2 Load Cell Pedals',
        amazonUrl: 'https://www.amazon.com/s?k=MOZA+CRP2+load+cell+pedals',
        note: 'load-cell brake, managed in the same Pit House software'
      },
      'gpu-rtx-5060-ti': {
        name: 'NVIDIA GeForce RTX 5060 Ti (8 GB)',
        amazonUrl: 'https://www.amazon.com/s?k=RTX+5060+Ti+8GB+graphics+card',
        note: 'renders iRacing and NVENC-encodes the stream on the same chip'
      },
      'cpu-ryzen-7-5700': {
        name: 'AMD Ryzen 7 5700',
        amazonUrl: 'https://www.amazon.com/s?k=AMD+Ryzen+7+5700+processor',
        note: '8 cores — plenty for iRacing plus OBS on one PC'
      },
      'monitor-1440p-120': {
        name: '1440p 120 Hz+ G-SYNC Compatible Gaming Monitor',
        amazonUrl: 'https://www.amazon.com/s?k=1440p+144hz+g-sync+compatible+gaming+monitor',
        note: 'my single-screen setup — high refresh matters more than size'
      },
      'whoop': {
        name: 'WHOOP 4.0 Band',
        amazonUrl: 'https://www.amazon.com/s?k=WHOOP+4.0+band',
        note: 'drives the live heart-rate overlay on my streams'
      },

      /* ── The buying ladder (recommended, tier by tier) ────── */
      'logitech-g923': {
        name: 'Logitech G923 Racing Wheel',
        amazonUrl: 'https://www.amazon.com/s?k=Logitech+G923+racing+wheel',
        note: 'belt-driven, the easiest on-ramp into iRacing'
      },
      'thrustmaster-t300': {
        name: 'Thrustmaster T300 RS GT',
        amazonUrl: 'https://www.amazon.com/s?k=Thrustmaster+T300+RS+GT',
        note: 'long-standing budget pick'
      },
      'moza-r5': {
        name: 'MOZA R5 Bundle',
        amazonUrl: 'https://www.amazon.com/s?k=MOZA+R5+bundle+direct+drive',
        note: 'entry direct drive — the first real fidelity jump'
      },
      'fanatec-csl-dd': {
        name: 'Fanatec CSL DD',
        amazonUrl: 'https://www.amazon.com/s?k=Fanatec+CSL+DD',
        note: 'entry direct drive with Fanatec’s ecosystem'
      },
      'moza-r12': {
        name: 'MOZA R12 Direct Drive Wheelbase',
        amazonUrl: 'https://www.amazon.com/s?k=MOZA+R12+direct+drive+wheel+base',
        note: 'high-end direct drive, maximum headroom'
      },
      'fanatec-clubsport-dd': {
        name: 'Fanatec ClubSport DD+',
        amazonUrl: 'https://www.amazon.com/s?k=Fanatec+ClubSport+DD%2B',
        note: 'high-end, deep licensed-rim catalog'
      },
      'meta-quest-3': {
        name: 'Meta Quest 3',
        amazonUrl: 'https://www.amazon.com/s?k=Meta+Quest+3',
        note: 'the most common way into PCVR sim racing'
      },
      'thrustmaster-t-lcm': {
        name: 'Thrustmaster T-LCM Pedals',
        amazonUrl: 'https://www.amazon.com/s?k=Thrustmaster+T-LCM+pedals',
        note: 'cheapest genuine load cell, works with any base over USB'
      },
      'moza-sr-p': {
        name: 'MOZA SR-P Load Cell Pedals',
        amazonUrl: 'https://www.amazon.com/s?k=MOZA+SR-P+load+cell+pedals',
        note: 'budget load cell on the same Pit House ecosystem as my R9'
      },
      'fanatec-csl-pedals-lc': {
        name: 'Fanatec CSL Pedals + Load Cell Kit',
        amazonUrl: 'https://www.amazon.com/s?k=Fanatec+CSL+pedals+load+cell+kit',
        note: 'modular upgrade path inside the Fanatec ecosystem'
      },
      'cockpit': {
        name: 'Sim Racing Cockpit / Wheel Stand',
        amazonUrl: 'https://www.amazon.com/s?k=sim+racing+cockpit+stand',
        note: 'a rigid mount matters more than the brand — flex kills FFB detail'
      }
    }
  };

  var DISCLOSURE = 'Some links are affiliate links — I may earn a commission at no cost to you.';

  /* Build the outbound URL for a product key.
   * Appends ?tag= ONLY once a real Associates tag is configured. */
  function affUrl(key) {
    var p = RIR_AFF.products[key];
    if (!p) return '#';
    var url = p.amazonUrl;
    if (RIR_AFF.amazonTag && RIR_AFF.amazonTag !== 'PENDING-20') {
      url += (url.indexOf('?') === -1 ? '?' : '&') + 'tag=' + encodeURIComponent(RIR_AFF.amazonTag);
    }
    return url;
  }

  /* Render a styled "gear used / recommended" box into #containerId.
   * keys  — array of product keys from RIR_AFF.products
   * title — optional box label (default: 'Gear used & recommended') */
  function renderGearBox(containerId, keys, title) {
    var el = document.getElementById(containerId);
    if (!el) return;

    /* Posts are rendered with the gear box already in the HTML (build-time,
     * see _deploy/generate-blogs.js) so the affiliate links are crawlable and
     * work without JS. If the container is already populated, leave it — this
     * call is then a no-op kept for older pages that still ship an empty div. */
    if (el.querySelector('.gear-box')) {
      hydrateLinks(el);
      return;
    }

    var box = document.createElement('div');
    box.className = 'gear-box';

    var label = document.createElement('span');
    label.className = 'box-label';
    label.textContent = title || 'Gear used & recommended';
    box.appendChild(label);

    var ul = document.createElement('ul');
    (keys || []).forEach(function (key) {
      var p = RIR_AFF.products[key];
      if (!p) return;
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = affUrl(key);
      a.target = '_blank';
      a.rel = 'sponsored noopener';
      a.textContent = p.name;
      li.appendChild(a);
      if (p.note) li.appendChild(document.createTextNode(' — ' + p.note));
      ul.appendChild(li);
    });
    box.appendChild(ul);

    /* FTC affiliate disclosure — always rendered with the box */
    var note = document.createElement('p');
    note.className = 'aff-note';
    note.textContent = DISCLOSURE;
    box.appendChild(note);

    el.innerHTML = '';
    el.appendChild(box);
  }

  /* Hydrate static anchors carrying data-aff="key" — sets href,
   * target and rel from the central config (used on /gear.html). */
  function hydrateLinks(root) {
    var nodes = (root || document).querySelectorAll('[data-aff]');
    Array.prototype.forEach.call(nodes, function (a) {
      var key = a.getAttribute('data-aff');
      if (!RIR_AFF.products[key]) return;
      a.href = affUrl(key);
      a.target = '_blank';
      a.rel = 'sponsored noopener';
    });
  }

  RIR_AFF.affUrl = affUrl;
  RIR_AFF.renderGearBox = renderGearBox;
  RIR_AFF.hydrateLinks = hydrateLinks;
  RIR_AFF.disclosure = DISCLOSURE;

  global.RIR_AFF = RIR_AFF;
  global.affUrl = affUrl;
  global.renderGearBox = renderGearBox;
})(window);
