'use strict';

const SEED_DATA = [
  {
    title: 'Creare și emitere voucher',
    description: 'Pași pentru completarea și emiterea unui voucher',
    type: 'pdf',
    url: 'https://drive.google.com/file/d/PLACEHOLDER_PDF_1/view',
    order: 1,
  },
  {
    title: 'Gestionare lucrători',
    description: 'Adăugare, editare și validare RSP',
    type: 'pdf',
    url: 'https://drive.google.com/file/d/PLACEHOLDER_PDF_2/view',
    order: 2,
  },
  {
    title: 'Raportare IPC-21',
    description: 'Generare și transmitere raport lunar',
    type: 'pdf',
    url: 'https://drive.google.com/file/d/PLACEHOLDER_PDF_3/view',
    order: 3,
  },
  {
    title: 'Introducere în platformă',
    description: 'Prezentare generală a funcționalităților',
    type: 'video',
    url: 'https://drive.google.com/file/d/PLACEHOLDER_VIDEO_1/view',
    order: 4,
  },
  {
    title: 'Cum creezi un voucher',
    description: 'Tutorial pas cu pas pentru creare voucher',
    type: 'video',
    url: 'https://drive.google.com/file/d/PLACEHOLDER_VIDEO_2/view',
    order: 5,
  },
];

module.exports = {
  async register() {},

  async bootstrap({ strapi }) {
    // Seed doar dacă nu există nicio înregistrare
    const count = await strapi.entityService.count('api::guide-entry.guide-entry');
    if (count > 0) return;

    for (const entry of SEED_DATA) {
      await strapi.entityService.create('api::guide-entry.guide-entry', {
        data: { ...entry, publishedAt: new Date() },
      });
    }

    strapi.log.info(`[seed] ${SEED_DATA.length} guide entries create.`);
  },
};
