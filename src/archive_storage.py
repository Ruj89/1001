from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Iterable, Mapping

from archive_model import ArchiveMetadataRecord, SottoVarianteRecord, TitoloRecord

ARCHIVE_STORAGE_SCHEMA_VERSION = "v1"


class ArchiveStorageError(Exception):
    """Base exception for local archive storage boundary failures."""


class ArchiveStorageVersionError(ArchiveStorageError):
    """Raised when a persisted payload uses an unsupported schema version."""


class ArchiveStorageShapeError(ArchiveStorageError):
    """Raised when a persisted payload violates the storage contract."""


class ArchiveStorageConfirmationError(ArchiveStorageError):
    """Raised when overwrite activation is requested without a staged import."""


class ArchiveStorageMutationError(ArchiveStorageError):
    """Raised when a create or update operation cannot be applied safely."""


@dataclass(frozen=True, slots=True, init=False)
class PendingImportRecord:
    """Transient import candidate kept separate from the active archive."""

    source_name: str
    titoli: tuple[TitoloRecord, ...]
    staged_at: datetime

    def __init__(
        self,
        source_name: str,
        titoli: Iterable[TitoloRecord],
        staged_at: datetime,
    ) -> None:
        normalized_source_name = source_name.strip()
        normalized_titles = tuple(titoli)

        if not normalized_source_name:
            raise ValueError("source_name must be a non-blank string")
        if not isinstance(staged_at, datetime):
            raise TypeError("staged_at must be a datetime")
        if not normalized_titles:
            raise ValueError("pending import must contain at least one title")
        if not all(isinstance(title, TitoloRecord) for title in normalized_titles):
            raise TypeError("pending import titles must contain only TitoloRecord items")

        object.__setattr__(self, "source_name", normalized_source_name)
        object.__setattr__(self, "titoli", normalized_titles)
        object.__setattr__(self, "staged_at", staged_at)


@dataclass(frozen=True, slots=True, init=False)
class LocalArchiveStorage:
    """Schema-versioned local storage payload for active and pending archive state."""

    schema_version: str
    active_titles: tuple[TitoloRecord, ...]
    metadata: ArchiveMetadataRecord
    pending_import: PendingImportRecord | None

    def __init__(
        self,
        schema_version: str,
        active_titles: Iterable[TitoloRecord],
        metadata: ArchiveMetadataRecord,
        pending_import: PendingImportRecord | None = None,
    ) -> None:
        normalized_schema_version = schema_version.strip()
        normalized_titles = tuple(active_titles)

        if not normalized_schema_version:
            raise ValueError("schema_version must be a non-blank string")
        if not isinstance(metadata, ArchiveMetadataRecord):
            raise TypeError("metadata must be an ArchiveMetadataRecord")
        if not all(isinstance(title, TitoloRecord) for title in normalized_titles):
            raise TypeError("active_titles must contain only TitoloRecord items")
        if pending_import is not None and not isinstance(pending_import, PendingImportRecord):
            raise TypeError("pending_import must be a PendingImportRecord or None")
        if metadata.archivio_attivo and len(normalized_titles) != metadata.numero_record:
            raise ValueError(
                "active_titles length must match metadata.numero_record for an active archive"
            )
        if not metadata.archivio_attivo and normalized_titles:
            raise ValueError("active_titles must be empty when metadata.archivio_attivo is False")

        object.__setattr__(self, "schema_version", normalized_schema_version)
        object.__setattr__(self, "active_titles", normalized_titles)
        object.__setattr__(self, "metadata", metadata)
        object.__setattr__(self, "pending_import", pending_import)


def build_empty_local_archive_storage() -> LocalArchiveStorage:
    return LocalArchiveStorage(
        schema_version=ARCHIVE_STORAGE_SCHEMA_VERSION,
        active_titles=(),
        metadata=ArchiveMetadataRecord(
            archivio_attivo=False,
            numero_record=0,
            ultima_modifica_locale=None,
            versione_schema=ARCHIVE_STORAGE_SCHEMA_VERSION,
        ),
        pending_import=None,
    )


def build_active_local_archive_storage(
    titoli: Iterable[TitoloRecord],
    *,
    activated_at: datetime,
) -> LocalArchiveStorage:
    normalized_titles = tuple(titoli)
    if not normalized_titles:
        raise ValueError("active archive storage must contain at least one title")
    if not isinstance(activated_at, datetime):
        raise TypeError("activated_at must be a datetime")

    return LocalArchiveStorage(
        schema_version=ARCHIVE_STORAGE_SCHEMA_VERSION,
        active_titles=normalized_titles,
        metadata=ArchiveMetadataRecord(
            archivio_attivo=True,
            numero_record=len(normalized_titles),
            ultima_modifica_locale=activated_at,
            versione_schema=ARCHIVE_STORAGE_SCHEMA_VERSION,
        ),
        pending_import=None,
    )


def stage_pending_import(
    storage: LocalArchiveStorage,
    *,
    source_name: str,
    titoli: Iterable[TitoloRecord],
    staged_at: datetime,
) -> LocalArchiveStorage:
    return LocalArchiveStorage(
        schema_version=storage.schema_version,
        active_titles=storage.active_titles,
        metadata=storage.metadata,
        pending_import=PendingImportRecord(
            source_name=source_name,
            titoli=titoli,
            staged_at=staged_at,
        ),
    )


def clear_pending_import(storage: LocalArchiveStorage) -> LocalArchiveStorage:
    return LocalArchiveStorage(
        schema_version=storage.schema_version,
        active_titles=storage.active_titles,
        metadata=storage.metadata,
        pending_import=None,
    )


def has_active_archive(storage: LocalArchiveStorage) -> bool:
    return storage.metadata.archivio_attivo


def requires_overwrite_confirmation(storage: LocalArchiveStorage) -> bool:
    return has_active_archive(storage)


def resolve_pending_import_overwrite(
    storage: LocalArchiveStorage,
    *,
    confirmed: bool,
    resolved_at: datetime,
) -> LocalArchiveStorage:
    if storage.pending_import is None:
        raise ArchiveStorageConfirmationError(
            "cannot resolve overwrite without a staged pending import"
        )
    if not isinstance(confirmed, bool):
        raise TypeError("confirmed must be a bool")
    if not isinstance(resolved_at, datetime):
        raise TypeError("resolved_at must be a datetime")

    if not confirmed:
        return clear_pending_import(storage)

    return LocalArchiveStorage(
        schema_version=storage.schema_version,
        active_titles=storage.pending_import.titoli,
        metadata=ArchiveMetadataRecord(
            archivio_attivo=True,
            numero_record=len(storage.pending_import.titoli),
            ultima_modifica_locale=resolved_at,
            versione_schema=storage.schema_version,
        ),
        pending_import=None,
    )


def update_title_record(
    storage: LocalArchiveStorage,
    *,
    existing_title: str,
    updated_title: TitoloRecord,
    updated_at: datetime,
) -> LocalArchiveStorage:
    normalized_existing_title = existing_title.strip()
    if not normalized_existing_title:
        raise ValueError("existing_title must be a non-blank string")
    if not isinstance(updated_title, TitoloRecord):
        raise TypeError("updated_title must be a TitoloRecord")

    current_titles = list(_require_active_titles(storage))
    target_index = _find_title_index(current_titles, normalized_existing_title)
    _ensure_no_duplicate_title(
        current_titles,
        candidate_title=updated_title.titolo,
        ignored_index=target_index,
    )
    current_titles[target_index] = updated_title
    return _rebuild_active_storage(storage, current_titles, updated_at=updated_at)


def update_sub_variant_record(
    storage: LocalArchiveStorage,
    *,
    title: str,
    variant_index: int,
    updated_variant: SottoVarianteRecord,
    updated_at: datetime,
) -> LocalArchiveStorage:
    normalized_title = title.strip()
    if not normalized_title:
        raise ValueError("title must be a non-blank string")
    if not isinstance(variant_index, int):
        raise TypeError("variant_index must be an int")
    if variant_index < 0:
        raise ValueError("variant_index must be zero or greater")
    if not isinstance(updated_variant, SottoVarianteRecord):
        raise TypeError("updated_variant must be a SottoVarianteRecord")

    current_titles = list(_require_active_titles(storage))
    target_index = _find_title_index(current_titles, normalized_title)
    target_title = current_titles[target_index]

    if variant_index >= len(target_title.sotto_varianti):
        raise ArchiveStorageMutationError(
            f"variant_index {variant_index} is out of range for title {target_title.titolo!r}"
        )

    updated_variants = list(target_title.sotto_varianti)
    updated_variants[variant_index] = updated_variant
    current_titles[target_index] = TitoloRecord(
        titolo=target_title.titolo,
        sotto_varianti=tuple(updated_variants),
    )
    return _rebuild_active_storage(storage, current_titles, updated_at=updated_at)


def create_title_record(
    storage: LocalArchiveStorage,
    *,
    new_title: TitoloRecord,
    created_at: datetime,
) -> LocalArchiveStorage:
    if not isinstance(new_title, TitoloRecord):
        raise TypeError("new_title must be a TitoloRecord")

    current_titles = list(storage.active_titles)
    _ensure_no_duplicate_title(current_titles, candidate_title=new_title.titolo, ignored_index=None)
    current_titles.append(new_title)
    return _rebuild_active_storage(storage, current_titles, updated_at=created_at)


def serialize_local_archive_storage(storage: LocalArchiveStorage) -> dict[str, object]:
    active_archive: dict[str, object] | None
    if storage.metadata.archivio_attivo:
        active_archive = {
            "titles": [_serialize_title_record(title) for title in storage.active_titles],
            "metadata": _serialize_metadata_record(storage.metadata),
        }
    else:
        active_archive = None

    pending_import: dict[str, object] | None
    if storage.pending_import is None:
        pending_import = None
    else:
        pending_import = {
            "sourceName": storage.pending_import.source_name,
            "stagedAt": storage.pending_import.staged_at.isoformat(),
            "titles": [_serialize_title_record(title) for title in storage.pending_import.titoli],
        }

    return {
        "schemaVersion": storage.schema_version,
        "activeArchive": active_archive,
        "pendingImport": pending_import,
    }


def deserialize_local_archive_storage(
    payload: Mapping[str, object] | None,
) -> LocalArchiveStorage:
    if payload is None:
        return build_empty_local_archive_storage()
    if not isinstance(payload, Mapping):
        raise ArchiveStorageShapeError("storage payload must be a mapping")

    schema_version = payload.get("schemaVersion")
    if not isinstance(schema_version, str) or not schema_version.strip():
        raise ArchiveStorageShapeError("storage payload must include a non-blank schemaVersion")
    if schema_version != ARCHIVE_STORAGE_SCHEMA_VERSION:
        raise ArchiveStorageVersionError(
            f"unsupported schema version {schema_version!r}; expected {ARCHIVE_STORAGE_SCHEMA_VERSION!r}"
        )

    active_archive = payload.get("activeArchive")
    pending_import_payload = payload.get("pendingImport")

    if active_archive is None:
        storage = build_empty_local_archive_storage()
    else:
        if not isinstance(active_archive, Mapping):
            raise ArchiveStorageShapeError("activeArchive must be a mapping or null")

        titles_payload = active_archive.get("titles")
        metadata_payload = active_archive.get("metadata")
        if not isinstance(titles_payload, list):
            raise ArchiveStorageShapeError("activeArchive.titles must be a list")
        if not isinstance(metadata_payload, Mapping):
            raise ArchiveStorageShapeError("activeArchive.metadata must be a mapping")

        active_titles = tuple(_deserialize_title_record(item) for item in titles_payload)
        metadata = _deserialize_metadata_record(metadata_payload)
        storage = LocalArchiveStorage(
            schema_version=schema_version,
            active_titles=active_titles,
            metadata=metadata,
            pending_import=None,
        )

    if pending_import_payload is None:
        return storage
    if not isinstance(pending_import_payload, Mapping):
        raise ArchiveStorageShapeError("pendingImport must be a mapping or null")

    source_name = pending_import_payload.get("sourceName")
    staged_at = pending_import_payload.get("stagedAt")
    titles_payload = pending_import_payload.get("titles")

    if not isinstance(source_name, str) or not source_name.strip():
        raise ArchiveStorageShapeError("pendingImport.sourceName must be a non-blank string")
    if not isinstance(staged_at, str):
        raise ArchiveStorageShapeError("pendingImport.stagedAt must be an ISO datetime string")
    if not isinstance(titles_payload, list):
        raise ArchiveStorageShapeError("pendingImport.titles must be a list")

    return LocalArchiveStorage(
        schema_version=storage.schema_version,
        active_titles=storage.active_titles,
        metadata=storage.metadata,
        pending_import=PendingImportRecord(
            source_name=source_name,
            titoli=tuple(_deserialize_title_record(item) for item in titles_payload),
            staged_at=_parse_datetime(staged_at, context="pendingImport.stagedAt"),
        ),
    )


def _serialize_title_record(title: TitoloRecord) -> dict[str, object]:
    return {
        "titolo": title.titolo,
        "sottoVarianti": [
            {
                "piattaforma": variant.piattaforma,
                "edizioneVersione": variant.edizione_versione,
                "supporto": variant.supporto,
                "stato": variant.stato,
            }
            for variant in title.sotto_varianti
        ],
    }


def _deserialize_title_record(payload: object) -> TitoloRecord:
    if not isinstance(payload, Mapping):
        raise ArchiveStorageShapeError("title payload must be a mapping")

    titolo = payload.get("titolo")
    sotto_varianti = payload.get("sottoVarianti")
    if not isinstance(titolo, str) or not titolo.strip():
        raise ArchiveStorageShapeError("title payload must include a non-blank titolo")
    if not isinstance(sotto_varianti, list):
        raise ArchiveStorageShapeError("title payload must include a sottoVarianti list")

    return TitoloRecord(
        titolo=titolo,
        sotto_varianti=tuple(_deserialize_variant_record(item) for item in sotto_varianti),
    )


def _deserialize_variant_record(payload: object) -> SottoVarianteRecord:
    if not isinstance(payload, Mapping):
        raise ArchiveStorageShapeError("variant payload must be a mapping")

    piattaforma = payload.get("piattaforma")
    edizione_versione = payload.get("edizioneVersione")
    supporto = payload.get("supporto")
    stato = payload.get("stato")

    if not all(isinstance(value, str) for value in (piattaforma, edizione_versione, supporto, stato)):
        raise ArchiveStorageShapeError(
            "variant payload must contain string piattaforma, edizioneVersione, supporto, stato"
        )

    return SottoVarianteRecord(
        piattaforma=piattaforma,
        edizione_versione=edizione_versione,
        supporto=supporto,
        stato=stato,
    )


def _serialize_metadata_record(metadata: ArchiveMetadataRecord) -> dict[str, object]:
    return {
        "archivioAttivo": metadata.archivio_attivo,
        "numeroRecord": metadata.numero_record,
        "ultimaModificaLocale": (
            None
            if metadata.ultima_modifica_locale is None
            else metadata.ultima_modifica_locale.isoformat()
        ),
        "versioneSchema": metadata.versione_schema,
    }


def _deserialize_metadata_record(payload: Mapping[str, object]) -> ArchiveMetadataRecord:
    archivio_attivo = payload.get("archivioAttivo")
    numero_record = payload.get("numeroRecord")
    ultima_modifica_locale = payload.get("ultimaModificaLocale")
    versione_schema = payload.get("versioneSchema")

    if not isinstance(archivio_attivo, bool):
        raise ArchiveStorageShapeError("metadata.archivioAttivo must be a bool")
    if not isinstance(numero_record, int):
        raise ArchiveStorageShapeError("metadata.numeroRecord must be an int")
    if ultima_modifica_locale is not None and not isinstance(ultima_modifica_locale, str):
        raise ArchiveStorageShapeError(
            "metadata.ultimaModificaLocale must be null or an ISO datetime string"
        )
    if not isinstance(versione_schema, str) or not versione_schema.strip():
        raise ArchiveStorageShapeError("metadata.versioneSchema must be a non-blank string")

    return ArchiveMetadataRecord(
        archivio_attivo=archivio_attivo,
        numero_record=numero_record,
        ultima_modifica_locale=(
            None
            if ultima_modifica_locale is None
            else _parse_datetime(ultima_modifica_locale, context="metadata.ultimaModificaLocale")
        ),
        versione_schema=versione_schema,
    )


def _parse_datetime(value: str, *, context: str) -> datetime:
    try:
        return datetime.fromisoformat(value)
    except ValueError as exc:
        raise ArchiveStorageShapeError(f"{context} must be a valid ISO datetime string") from exc


def _require_active_titles(storage: LocalArchiveStorage) -> tuple[TitoloRecord, ...]:
    if not storage.metadata.archivio_attivo:
        raise ArchiveStorageMutationError("cannot mutate titles when no active archive exists")
    return storage.active_titles


def _find_title_index(
    titles: list[TitoloRecord],
    normalized_title: str,
) -> int:
    for index, title in enumerate(titles):
        if title.titolo == normalized_title:
            return index
    raise ArchiveStorageMutationError(f"title {normalized_title!r} was not found in active archive")


def _ensure_no_duplicate_title(
    titles: list[TitoloRecord],
    *,
    candidate_title: str,
    ignored_index: int | None,
) -> None:
    for index, title in enumerate(titles):
        if ignored_index is not None and index == ignored_index:
            continue
        if title.titolo == candidate_title:
            raise ArchiveStorageMutationError(
                f"title {candidate_title!r} already exists in active archive"
            )


def _rebuild_active_storage(
    storage: LocalArchiveStorage,
    titles: list[TitoloRecord],
    *,
    updated_at: datetime,
) -> LocalArchiveStorage:
    if not isinstance(updated_at, datetime):
        raise TypeError("updated_at must be a datetime")
    if not titles:
        raise ArchiveStorageMutationError("active archive writes must preserve at least one title")

    return LocalArchiveStorage(
        schema_version=storage.schema_version,
        active_titles=tuple(titles),
        metadata=ArchiveMetadataRecord(
            archivio_attivo=True,
            numero_record=len(titles),
            ultima_modifica_locale=updated_at,
            versione_schema=storage.schema_version,
        ),
        pending_import=storage.pending_import,
    )
