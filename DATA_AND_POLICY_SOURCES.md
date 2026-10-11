# Data and Policy Sources — SuryaSathi

## Source rules

Use primary sources where possible. For each snapshot, record source URL, retrieval timestamp (IST/UTC as appropriate), effective date if stated, local filename/hash, and any transformation performed. A source's presence on a webpage does not guarantee there is a machine-readable API.

## Solar performance / meteorology

### PVGIS — European Commission Joint Research Centre

- URL: https://joint-research-centre.ec.europa.eu/photovoltaic-geographical-information-system-pvgis/using-pvgis-6/using-pvgis_en
- Purpose: reference PV performance, power/energy time series, meteorological data and solar position as supported by its API.
- Use: backend call with timeout; cache the reference result where appropriate.
- Caveats: record request parameters and API version. Do not infer exact rooftop obstruction shading from a location-level PVGIS estimate.

### pvlib-python

- URL: https://pvlib-python.readthedocs.io/
- Purpose: deterministic solar position, irradiance and PV modelling functions that are actually implemented.
- It is a library, not a source of local module specification or official policy. Pin a compatible version after testing.

## Government and policy

### PM Surya Ghar / MNRE

- Scheme portal: https://pmsuryaghar.gov.in/
- MNRE: https://mnre.gov.in/
- Use current official material for central subsidy values, eligible case conditions, benchmark rates and process. Save a dated snapshot. Do not treat historical blog posts as current policy.

### ALMM — MNRE

- URL: https://mnre.gov.in/en/approved-list-of-models-and-manufacturers-almm/
- Use the current applicable list/snapshot only when exact manufacturer and model can be matched.
- Record the list date/version and exact matched fields.
- `NOT_FOUND_IN_SNAPSHOT` is not the same as a definitive legal finding of non-compliance.
- If the current list cannot be downloaded/parsed reliably during the sprint, limit the feature to a clearly labelled manual status check or mark it `UNVERIFIED`.

### State DISCOM / regulator

Only include a single state/distribution company if its current official tariff order is readily available and fields can be interpreted correctly. Do not generalize one DISCOM's tariff or subsidy handling to all of India. If tariff handling threatens the sprint, keep tariff/payback as optional and concentrate on the quote's physical/specification checks.

## Panel specifications

Use the exact manufacturer product datasheet and model code wherever a specific module is named. Store:

- manufacturer and exact model
- rated power W
- length and width (with units)
- datasheet URL
- date accessed
- fields verified

If the exact model isn't found, don't substitute a “similar” module silently. Use an explicit generic assumption that the user confirms.

## Demo/evaluation documents

- Synthetic documents are acceptable for deterministic integration tests if clearly labelled synthetic.
- If a real bill/quote is used, obtain consent and redact name, address, consumer/account numbers, QR codes and other personal information.
- Don't put private documents in a public repo.
- Public sample quote should be created expressly for the demo or sourced with rights that allow reuse.

## Policy snapshot shape

Example (schema illustrative):

```json
{
  "policy_id": "pm-surya-ghar-central-cfa",
  "source_url": "https://pmsuryaghar.gov.in/",
  "retrieved_at": "2026-10-10T00:00:00Z",
  "effective_date": "verify-from-source",
  "verification_status": "reviewed",
  "rules": [],
  "notes": ["Confirm applicability to the user's specific case"]
}
```

Do not store made-up effective dates or claim a snapshot is verified until someone has opened the source and checked the actual rule.
