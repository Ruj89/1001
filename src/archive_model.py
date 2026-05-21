from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Iterable


@dataclass(frozen=True, slots=True, init=False)
class SottoVarianteRecord:
    """Canonical MVP sub-variant with the 4 required archive fields."""

    piattaforma: str
    edizione_versione: str
    supporto: str
    stato: str

    def __init__(
        self,
        piattaforma: str,
        edizione_versione: str,
        supporto: str,
        stato: str,
    ) -> None:
        normalized_piattaforma = piattaforma.strip()
        normalized_edizione_versione = edizione_versione.strip()
        normalized_supporto = supporto.strip()
        normalized_stato = stato.strip()

        if not normalized_piattaforma:
            raise ValueError("piattaforma must be a non-blank string")
        if not normalized_edizione_versione:
            raise ValueError("edizione_versione must be a non-blank string")
        if not normalized_supporto:
            raise ValueError("supporto must be a non-blank string")
        if not normalized_stato:
            raise ValueError("stato must be a non-blank string")

        object.__setattr__(self, "piattaforma", normalized_piattaforma)
        object.__setattr__(self, "edizione_versione", normalized_edizione_versione)
        object.__setattr__(self, "supporto", normalized_supporto)
        object.__setattr__(self, "stato", normalized_stato)


@dataclass(frozen=True, slots=True, init=False)
class TitoloRecord:
    """Primary MVP archive record: one title with ordered sub-variants."""

    titolo: str
    sotto_varianti: tuple[SottoVarianteRecord, ...]

    def __init__(
        self,
        titolo: str,
        sotto_varianti: Iterable[SottoVarianteRecord],
    ) -> None:
        normalized_title = titolo.strip()
        normalized_variants = tuple(sotto_varianti)

        if not normalized_title:
            raise ValueError("titolo must be a non-blank string")
        if not normalized_variants:
            raise ValueError("titolo must contain at least one sotto-variante")
        if not all(isinstance(variant, SottoVarianteRecord) for variant in normalized_variants):
            raise TypeError("sotto_varianti must contain only SottoVarianteRecord items")

        object.__setattr__(self, "titolo", normalized_title)
        object.__setattr__(self, "sotto_varianti", normalized_variants)


@dataclass(frozen=True, slots=True, init=False)
class ArchiveMetadataRecord:
    """Minimum metadata for the active archive dataset state."""

    archivio_attivo: bool
    numero_record: int
    ultima_modifica_locale: datetime | None
    versione_schema: str

    def __init__(
        self,
        archivio_attivo: bool,
        numero_record: int,
        ultima_modifica_locale: datetime | None,
        versione_schema: str,
    ) -> None:
        normalized_schema_version = versione_schema.strip()

        if not isinstance(archivio_attivo, bool):
            raise TypeError("archivio_attivo must be a bool")
        if not isinstance(numero_record, int):
            raise TypeError("numero_record must be an int")
        if numero_record < 0:
            raise ValueError("numero_record must be zero or greater")
        if ultima_modifica_locale is not None and not isinstance(ultima_modifica_locale, datetime):
            raise TypeError("ultima_modifica_locale must be a datetime or None")
        if not normalized_schema_version:
            raise ValueError("versione_schema must be a non-blank string")
        if not archivio_attivo:
            if numero_record != 0:
                raise ValueError("numero_record must be zero when archivio_attivo is False")
            if ultima_modifica_locale is not None:
                raise ValueError(
                    "ultima_modifica_locale must be None when archivio_attivo is False"
                )
        elif ultima_modifica_locale is None:
            raise ValueError(
                "ultima_modifica_locale must be provided when archivio_attivo is True"
            )

        object.__setattr__(self, "archivio_attivo", archivio_attivo)
        object.__setattr__(self, "numero_record", numero_record)
        object.__setattr__(self, "ultima_modifica_locale", ultima_modifica_locale)
        object.__setattr__(self, "versione_schema", normalized_schema_version)
