-- An unconfirmed office location has no coordinates, rather than a demo pin.
alter table settings
  alter column map_lat drop not null,
  alter column map_lng drop not null,
  alter column map_lat drop default,
  alter column map_lng drop default;
