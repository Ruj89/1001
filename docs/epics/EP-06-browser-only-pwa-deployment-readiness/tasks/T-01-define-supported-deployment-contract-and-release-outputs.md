# T-01 Define the supported deployment contract and release acceptance outputs

Status: `proposed`

Objective: Congelare il contratto di deployment supportato per Android, gli output attesi della procedura di rilascio e i limiti espliciti da non promettere nel MVP.

Subtasks:

- `ST-01.1` Derivare da [docs/deployment-strategy.md](/root/bed-project/docs/deployment-strategy.md) il target di deployment supportato e il perimetro Android da considerare autorevole.
- `ST-01.2` Formalizzare modalita' supportate e non supportate, incluso il rifiuto esplicito di `file://` come base installabile PWA.
- `ST-01.3` Definire gli output minimi della procedura di deployment: artefatto rilasciato, modalita' di accesso Android, aspettative offline e limiti dichiarati.
- `ST-01.4` Pubblicare il contratto come input normativo per runtime browser-only, rilascio HTTPS e verifica Android downstream.
