import * as migration_20261108_222630_initial from './20261108_222630_initial';

export const migrations = [
  {
    up: migration_20261108_222630_initial.up,
    down: migration_20261108_222630_initial.down,
    name: '20261108_222630_initial'
  },
];
