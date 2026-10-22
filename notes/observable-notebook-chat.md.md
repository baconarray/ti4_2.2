# Post-game Analysis of Twilight Imperium game logs

**Created:** 9/17/2026 12:33:43  
**Updated:** 10/21/2026 23:09:08  
**Exported:** 10/22/2026 10:55:42  

## User:

> 9/17/2026 12:33:45

```text
import { getGameLogs } from '../api.js';
import { getPlayerById, getPlayerByUserId, getPlayerByNumber, createPlayerTag } from './game-info.js';
import { getRelicFragmentNameByType, isScrolledToBottom, scrollToBottom } from '../utils/utilities.js';
import { isTradeComponentsEmpty, printTradeComponents, printCommandTokenList, printSystemUnitList, printUnitList, getPlanetName, getSystemNameByNumber, printUnitPlacementMessage } from '../utils/extras.js';
import { attachTextSlot, createLoadingIndicator } from '../utils/html-helpers.js';
import { isRider } from '../utils/action-card-helpers.js';
import { ActionCard } from '../constants/action-card.js';
import { UnitName } from '../constants/unit.js';
import { ExplorationCard, ExplorationType } from '../constants/exploration.js';
import { LegendaryPlanet, Planet } from '../constants/planet.js';
import { Faction } from '../constants/faction.js';
import { RelicName } from '../constants/relic.js';

let initialized = false;
let isLoading = false;
let reachedEnd = false;

const dateTimeFormatShort = Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
});

const dateTimeFormatLong = Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
});

function writeGameLog(log, prepend) {
    if (!log || !initialized) return;

    let message, iconClass;

    if (log.event === 'game created') {
        message = 'Game created.';
        iconClass = 'fa-solid fa-gamepad';
    }
    else if (log.event === 'system placed') {
        const systemNumber = log.details.systemNumber;
        const systemName = getSystemNameByNumber(systemNumber);
        message = `${createPlayerTag(log.user)} placed the <span class="system-link" data-number="${systemNumber}">${systemName}</span>.`;
        iconClass = 'fa-solid fa-layer-group';
    }
    else if (log.event == 'starting units placed') {
        message = `${createPlayerTag(log.user)} placed their starting units in their home system.`;
        iconClass = 'fa-solid fa-house-user';
    }
    else if (log.event === 'starting technology picked') {
        message = `${createPlayerTag(log.user)} picked <ti-preview-link data-name="${log.details.technologyName}" data-type="technology-card"></ti-preview-link> as their starting technology.`;
        iconClass = 'fa-solid fa-microchip';
    }
    else if (log.event === 'starting secret objective discarded') {
        message = `${createPlayerTag(log.user)} discarded one of their starting secret objectives.`;
        iconClass = 'fa-solid fa-trash-alt';
    }
    else if (log.event === 'secret objective discarded') {
        message = `${createPlayerTag(log.user)} discarded 1 secret objective.`;
        iconClass = 'fa-solid fa-trash-alt';
    }
    else if (log.event === 'action cards drawn') {
        message = log.details.cardsDrawn === 1 ? `${createPlayerTag(log.user)} drew 1 action card.` : `${createPlayerTag(log.user)} drew ${log.details.cardsDrawn} action cards.`;
        iconClass = 'fa-solid fa-file-medical';
    }
    else if (log.event === 'action cards discarded') {
        message = constructActionCardsDiscardedLog(log.user, log.details);
        iconClass = 'fa-solid fa-trash-alt';
    }
    else if (log.event === 'strategy card picked') {
        message = `${createPlayerTag(log.user)} picked the <ti-preview-link data-name="${log.details.strategyCard}" data-type="strategy-card"></ti-preview-link> strategy card`;

        if (log.details.tradeGoods && log.details.tradeGoods > 0) {
            message += log.details.tradeGoods === 1 ?
                ' and gained the 1 trade good on the card' :
                ` and gained the ${log.details.tradeGoods} trade goods on the card`;
        }

        message += '.';
        iconClass = 'fa-solid fa-hand-pointer';
    }
    else if (log.event === 'system activated') {
        const systemNumber = log.details.systemNumber;
        const systemName = getSystemNameByNumber(systemNumber);
        message = `${createPlayerTag(log.user)} activated the <span class="system-link" data-number="${systemNumber}">${systemName}</span>.`;
        iconClass = 'fa-solid fa-map-marker-alt';
    }
    else if (log.event === 'ships moved') {
        message = constructMovementLog(log.user, log.details.departedSystems);
        iconClass = 'fa-solid fa-plane-departure';
    }
    else if (log.event === 'units scuttled') {
      message = constructScuttleLog(log.user, log.details.systems);
      iconClass = 'fa-solid fa-plane-circle-xmark';
    }
    else if (log.event === 'space cannon offense rolled') {
        message = log.details.hitsProduced === 1 ?
            `${createPlayerTag(log.user)} rolled dice for Space Cannon Offense and produced 1 hit.` :
            `${createPlayerTag(log.user)} rolled dice for Space Cannon Offense and produced ${log.details.hitsProduced} hits.`;
        iconClass = 'fa-solid fa-dice';
    }
    else if (log.event === 'space cannon offense hits assigned') {
        message = constructHitsAssignedLog(log.user, log.details);
        iconClass = 'fa-solid fa-burst';
    }
    else if (log.event === 'anti-fighter barrage rolled') {
        message = log.details.hitsProduced === 1 ?
            `${createPlayerTag(log.user)} rolled dice for Anti-Fighter Barrage and produced 1 hit.` :
            `${createPlayerTag(log.user)} rolled dice for Anti-Fighter Barrage and produced ${log.details.hitsProduced} hits.`;
        iconClass = 'fa-solid fa-dice';
    }
    else if (log.event === 'anti-fighter barrage hits assigned') {
        message = constructHitsAssignedLog(log.user, log.details);
        iconClass = 'fa-solid fa-burst';
    }
    else if (log.event === 'announced retreats') {
        message = `${createPlayerTag(log.user)} announced retreats.`;
        iconClass = 'fa-solid fa-bullhorn';
    }
    else if (log.event === 'space combat rolled') {
        message = log.details.hitsProduced === 1 ?
            `${createPlayerTag(log.user)} rolled dice for Space Combat and produced 1 hit.` :
            `${createPlayerTag(log.user)} rolled dice for Space Combat and produced ${log.details.hitsProduced} hits.`;
        iconClass = 'fa-solid fa-dice';
    }
    else if (log.event === 'space combat hits assigned') {
        message = constructHitsAssignedLog(log.user, log.details);
        iconClass = 'fa-solid fa-burst';
    }
    else if (log.event === 'retreated') {
        const systemNumber = log.details.systemNumber;
        const systemName = getSystemNameByNumber(systemNumber);

        if (!log.details.departedSystem) {
            // Check for backwards compatibility before unit list was logged
            message = `${createPlayerTag(log.user)} retreated to the <span class="system-link" data-number="${systemNumber}">${systemName}</span>.`;
        }
        else if (!log.details.departedSystem.units) {
            // No units retreat (e.g. only fighters left)
            message = `${createPlayerTag(log.user)} did not retreat any units.`;
        }
        else {
            message = `${createPlayerTag(log.user)} retreated ${printSystemUnitList(log.details.departedSystem)} to the <span class="system-link" data-number="${systemNumber}">${systemName}</span>.`;
        }

        iconClass = 'fa-solid fa-flag';
    }
    else if (log.event === 'bombardment rolled') {
        message = constructBombardmentLog(log.user, log.details.hitsProduced);
        iconClass = 'fa-solid fa-dice';
    }
    else if (log.event === 'bombardment hits assigned') {
        message = constructBombardmentHitsAssignedLog(log.user, log.details);
        iconClass = 'fa-solid fa-burst';
    }
    else if (log.event === 'ground forces committed') {
        message = constructCommitGroundForcesLog(log.user, log.details);
        iconClass = 'fa-solid fa-plane-arrival';
    }
    else if (log.event === 'space cannon defense planet chosen') {
        message = `${createPlayerTag(log.user)} chose for Space Cannon Defense abilities to be first resolved on <ti-preview-link class="planet-link" data-name="${log.details.planetName}" data-type="planet-card"></ti-preview-link>.`;
        iconClass = 'fa-solid fa-location-crosshairs';
    }
    else if (log.event === 'space cannon defense rolled') {
        message = constructSpaceCannonDefenseRolledLog(log.user, log.details);
        iconClass = 'fa-solid fa-dice';
    }
    else if (log.event === 'space cannon defense hits assigned') {
        message = constructHitsAssignedLog(log.user, log.details);
        iconClass = 'fa-solid fa-burst';
    }
    else if (log.event === 'ground combat started') {
        message = `${createPlayerTag(log.user)} chose to start Ground Combat on <ti-preview-link class="planet-link" data-name="${log.details.planetName}" data-type="planet-card"></ti-preview-link>.`;
        iconClass = 'fa-solid fa-crosshairs';
    }
    else if (log.event === 'ground combat rolled') {
        message = log.details.hitsProduced === 1 ?
            `${createPlayerTag(log.user)} rolled dice for Ground Combat on <ti-preview-link class="planet-link" data-name="${log.details.planetName}" data-type="planet-card"></ti-preview-link> and produced 1 hit.` :
            `${createPlayerTag(log.user)} rolled dice for Ground Combat on <ti-preview-link class="planet-link" data-name="${log.details.planetName}" data-type="planet-card"></ti-preview-link> and produced ${log.details.hitsProduced} hits.`;
        iconClass = 'fa-solid fa-dice';
    }
    else if (log.event === 'ground combat hits assigned') {
        message = constructHitsAssignedLog(log.user, log.details);
        iconClass = 'fa-solid fa-burst';
    }
    else if (log.event === 'established control') {
        message = constructEstablishControlLog(log.user, log.details.planetNames);
        iconClass = 'fa-solid fa-globe-americas';
    }
    else if (log.event === 'units produced') {
        const systemNumber = log.details.systemNumber;
        const systemName = getSystemNameByNumber(systemNumber);
        message = log.details.units ?
            `${createPlayerTag(log.user)} produced ${printUnitList(log.details.units)} in the <span class="system-link" data-number="${systemNumber}">${systemName}</span>.` :
            `${createPlayerTag(log.user)} produced units in the <span class="system-link" data-number="${systemNumber}">${systemName}</span>.`;
        iconClass = 'fa-solid fa-plus';
    }
    else if (log.event === 'custodians token removed') {
        message = `${createPlayerTag(log.user)} removed the custodians token and gained 1 victory point.`;
        iconClass = 'fa-solid fa-broom'
    }
    else if (log.event === 'strategy card played') {
        message = `${createPlayerTag(log.user)} played the <ti-preview-link data-name="${log.details.strategyCard}" data-type="strategy-card"></ti-preview-link> strategy card.`;
        iconClass = 'fa-solid fa-play';
    }
    else if (log.event === 'primary ability resolved') {
        message = constructPrimaryAbilityLog(log.user, log.details.strategyCard, log.details.requirements);
        iconClass = 'fa-solid fa-check';
    }
    else if (log.event === 'top two agendas ordered') {
        message = constructOrderTopTwoAgendasLog(log.user, log.details.requirements);
        iconClass = 'fa-solid fa-check';
    }
    else if (log.event === 'commodities replenished') {
        message = `${createPlayerTag(log.user)} replenished commodities.`;
        iconClass = 'fa-solid fa-check';
    }
    else if (log.event === 'players to replenish commodities chosen') {
        message = constructPlayersToReplenishCommoditiesLog(log.user, log.details.playerNumbers);
        iconClass = 'fa-solid fa-check';
    }
    else if (log.event === 'second technology researched') {
        message = constructSecondTechnologyResearchLog(log.user, log.details.requirements);
        iconClass = 'fa-solid fa-check';
    }
    else if (log.event === 'secondary ability resolved') {
        message = constructSecondaryAbilityLog(log.user, log.details.strategyCard, log.details.requirements);
        iconClass = 'fa-solid fa-check-double';
    }
    else if (log.event === 'sustained damage') {
        message = constructSustainDamageLog(log.user, log.details);
        iconClass = 'fa-solid fa-wrench';
    }
    else if (log.event === 'ambush resolved' || log.event === 'assault cannon resolved' || log.event === 'dimensional splicer resolved') {
        message = `${createPlayerTag(log.user)} destroyed 1 ${log.details.unitName}.`;
        iconClass = 'fa-solid fa-burst';
    }
    else if (log.event === 'agenda card played') {
        message = constructAgendaLog(log.user, log.details.agendaName, log.details.requirements);
        iconClass = 'fa-solid fa-gear';
    }
    else if (log.event === 'player law gained') {
        message = constructPlayerLawGainedLog(log.user, log.details.agendaName);
        iconClass = 'fa-solid fa-repeat';
    }
    else if (log.event === 'relic card gained') {
        message = constructRelicCardGainedLog(log.user, log.details.relicName);
        iconClass = 'fa-solid fa-repeat';
    }
    else if (log.event === 'technology card played') {
        message = constructTechnologyLog(log.user, log.details.technologyName, log.details.requirements, log.details.count);
        iconClass = 'fa-solid fa-sim-card';
    }
    else if (log.event === 'promissory note played') {
        message = constructPromissoryNoteLog(log.user, log.details.promissoryNote, log.details.requirements);
        iconClass = 'fa-solid fa-link';
    }
    else if (log.event === 'support for the throne returned') {
        const owner = getPlayerByNumber(log.details.ownerPlayerNumber);
        message = `${createPlayerTag(log.user)} returned <ti-preview-link data-name="Support for the Throne" data-color="${owner.color}" data-type="promissory-note"></ti-preview-link> to ${createPlayerTag(owner.user._id)}`;
        message += log.details.victoryPointLost ? ' and lost 1 victory point.' : '.';
        iconClass = 'fa-solid fa-link';
    }
    else if (log.event === 'action card played') {
        message = constructActionCardLog(log.user, log.details.actionCardName, log.details.requirements);
        iconClass = 'fa-solid fa-play';
    }
    else if (log.event === 'component action card played') {
        message = constructComponentActionLog(log.user, log.details.actionCardName, log.details.requirements);
        iconClass = 'fa-solid fa-play';
    }
    else if (log.event === 'action card sabotaged') {
        message = `${createPlayerTag(log.user)} played the <ti-preview-link data-name="Sabotage" data-type="action-card"></ti-preview-link> action card to cancel the <ti-preview-link data-name="${log.details.actionCardName}" data-type="action-card"></ti-preview-link> action card.`;
        iconClass = 'fa-solid fa-times';
    }
    else if (log.event === 'ended turn') {
        message = `${createPlayerTag(log.user)} ended their turn.`;
        iconClass = 'fa-solid fa-pause';
    }
    else if (log.event === 'passed') {
        message = `${createPlayerTag(log.user)} passed.`;
        iconClass = 'fa-solid fa-ban';
    }
    else if (log.event === 'objective scored') {
        message = `${createPlayerTag(log.user)} scored the <ti-preview-link data-name="${log.details.objective}" data-type="objective-card"></ti-preview-link> objective.`;
        iconClass = 'fa-solid fa-star';
    }
    else if (log.event === 'public objective revealed') {
        message = `Public objective revealed: <ti-preview-link data-name="${log.details.objective}" data-type="objective-card"></ti-preview-link>.`;
        iconClass = 'fa-solid fa-search';
    }
    else if (log.event === 'command tokens redistributed') {
        message = constructCommandTokensRedistributedLog(log.user, log.details);
        iconClass = 'fa-solid fa-random';
    }
    else if (log.event === 'agenda discarded') {
        message = `<ti-preview-link data-name="${log.details.agendaName}" data-type="agenda-card"></ti-preview-link> revealed and discarded.`;
        iconClass = 'fa-solid fa-trash-alt';
    }
    else if (log.event === 'new agenda revealed') {
        message = `<ti-preview-link data-name="${log.details.agendaName}" data-type="agenda-card"></ti-preview-link> revealed.`;
        iconClass = 'fa-solid fa-search';
    }
    else if (log.event === 'first agenda revealed') {
        message = `First agenda revealed: <ti-preview-link data-name="${log.details.agenda}" data-type="agenda-card"></ti-preview-link>.`;
        iconClass = 'fa-solid fa-search';
    }
    else if (log.event === 'second agenda revealed') {
        message = `Second agenda revealed: <ti-preview-link data-name="${log.details.agenda}" data-type="agenda-card"></ti-preview-link>.`;
        iconClass = 'fa-solid fa-search';
    }
    else if (log.event === 'voted') {
        message = constructVoteLog(log.user, log.details.agenda, log.details.abstain, log.details.outcome, log.details.votes);
        iconClass = 'fa-solid fa-vote-yea';
    }
    else if (log.event === 'agenda resolved') {
        message = constructAgendaResolvedLog(log.details.agenda, log.details.outcome, log.details.tieBreak);
        iconClass = 'fa-solid fa-poll';
    }
    else if (log.event === 'trade request accepted') {
        message = constructTradeLog(log.details.tradeRequest);
        iconClass = 'fa-solid fa-handshake';
    }
    else if (log.event === 'plague rolled') {
        message = `${createPlayerTag(log.user)} rolled dice for <ti-preview-link data-name="Plague" data-type="action-card"></ti-preview-link> and destroyed ${log.details.successfulRolls} infantry.`;
        iconClass = 'fa-solid fa-dice';
    }
    else if (log.event === 'archaeological expedition resolved') {
        const card1 = `<ti-preview-link data-name="${log.details.explorationCardNames[0]}" data-type="exploration" data-exploration-type="${log.details.type}"></ti-preview-link>`;
        const card2 = `<ti-preview-link data-name="${log.details.explorationCardNames[1]}" data-type="exploration" data-exploration-type="${log.details.type}"></ti-preview-link>`;
        const card3 = `<ti-preview-link data-name="${log.details.explorationCardNames[2]}" data-type="exploration" data-exploration-type="${log.details.type}"></ti-preview-link>`;
        message = `${createPlayerTag(log.user)} drew ${card1}, ${card2}, and ${card3}.`;
        iconClass = 'fa-solid fa-layer-group';
    }
    else if (log.event === 'rolled for destroyed infantry') {
        message = log.details.zombies === 1 ?
            `${createPlayerTag(log.user)} rolled dice for their destroyed infantry and produced 1 successful roll.` :
            `${createPlayerTag(log.user)} rolled dice for their destroyed infantry and produced ${log.details.zombies} successful rolls.`;
        iconClass = 'fa-solid fa-dice';
    }
    else if (log.event === 'zombies placed') {
        message = `${createPlayerTag(log.user)} placed ${log.details.infantryPlaced} infantry in their home system using the Infantry II ability.`;
        iconClass = 'fa-solid fa-user-plus';
    }
    else if (log.event === 'faction ability used') {
        message = constructFactionAbilityLog(log.user, log.details.ability, log.details.requirements);
        iconClass = 'fa-solid fa-bolt';
    }
    else if (log.event === 'flagship ability used') {
        message = constructFlagshipAbilityLog(log.user, log.details.flagship, log.details.requirements);
        iconClass = 'fa-solid fa-space-shuttle';
    }
    else if (log.event === 'mech ability used') {
        message = constructMechAbilityUsedLog(log.user, log.details);
        iconClass = 'fa-solid fa-robot';
    }
    else if (log.event === 'legendary planet card played') {
        message = constructLegendaryPlanetCardPlayedLog(log.user, log.details);
        iconClass = 'fa-solid fa-moon fa-rotate-90';
    }
    else if (log.event === 'fleet reduced') {
        message = constructFleetReducedLog(log.user, log.details.removedSystems);
        iconClass = 'fa-solid fa-compress-arrows-alt';
    }
    else if (log.event === 'token removed from pool') {
        message = constructTokenRemovedFromPoolLog(log.user, log.details.chosenPool);
        iconClass = 'fa-solid fa-minus';
    }
    else if (log.event === 'exploration card drawn') {
        message = `${createPlayerTag(log.user)} drew the <ti-preview-link data-name="${log.details.name}" data-type="exploration" data-exploration-type="${log.details.type}"></ti-preview-link> exploration card.`;
        iconClass = 'fa-solid fa-compass';
    }
    else if (log.event === 'exploration card resolved') {
        message = constructExplorationCardResolvedLog(log.user, log.details.type, log.details.name, log.details.requirements);
        iconClass = 'fa-solid fa-compass';
    }
    else if (log.event === 'relic fragments played') {
        message = constructRelicFragmentsPlayedLog(log.user, log.details.type, log.details.relicFragments, log.details.unknownRelicFragments, log.details.relic);
        iconClass = 'fa-solid fa-gem';
    }
    else if (log.event === 'relic played') {
        message = constructRelicPlayedLog(log.user, log.details.name, log.details.requirements);
        iconClass = 'fa-solid fa-gem';
    }
    else if (log.event === 'JR-XS455-0 resolved') {
        message = constructJRXS4550ResolvedLog(log.user, log.details);
        iconClass = 'fa-solid fa-gem';
    }
    else if (log.event === 'leadership rider resolved') {
        message = constructLeadershipRiderResolvedLog(log.user, log.details);
        iconClass = 'fa-solid fa-check-square';
    }
    else if (log.event === 'diplomacy rider resolved') {
        message = constructDiplomacyRiderResolvedLog(log.user, log.details);
        iconClass = 'fa-solid fa-check-square';
    }
    else if (log.event === 'politics rider resolved') {
        message = constructPoliticsRiderResolvedLog(log.user);
        iconClass = 'fa-solid fa-check-square';
    }
    else if (log.event === 'construction rider resolved') {
        message = constructConstructionRiderResolvedLog(log.user, log.details);
        iconClass = 'fa-solid fa-check-square';
    }
    else if (log.event === 'trade rider resolved') {
        message = constructTradeRiderResolvedLog(log.user);
        iconClass = 'fa-solid fa-check-square';
    }
    else if (log.event === 'warfare rider resolved') {
        message = constructWarfareRiderResolvedLog(log.user, log.details);
        iconClass = 'fa-solid fa-check-square';
    }
    else if (log.event === 'imperial rider resolved') {
        message = constructImperialRiderResolvedLog(log.user);
        iconClass = 'fa-solid fa-check-square';
    }
    else if (log.event === 'diplomatic pressure resolved') {
        message = constructDiplomaticPressureResolvedLog(log.user, log.details);
        iconClass = 'fa-solid fa-check-square';
    }
    else if (log.event === 'research grant reallocation resolved') {
        message = constructResearchGrantReallocationResolvedLog(log.user, log.details);
        iconClass = 'fa-solid fa-check-square';
    }
    else if (log.event === 'player eliminated') {
        const eliminatedPlayer = getPlayerByNumber(log.details.playerNumber);
        message = `${createPlayerTag(eliminatedPlayer.user._id)} has been eliminated from the game.`;
        iconClass = 'fa-solid fa-skull-crossbones';
    }
    else if (log.event === 'game over') {
        const winner = getPlayerById(log.details.winner);
        message = `Game over. ${createPlayerTag(winner.user._id)} wins.`;
        iconClass = 'fa-solid fa-trophy';
    }
    else if (log.event === 'system activation undone') {
        const systemName = getSystemNameByNumber(log.details.systemNumber);
        message = `${createPlayerTag(log.user)} undid their activation of the <span class="system-link" data-number="${log.details.systemNumber}">${systemName}</span>.`;
        iconClass = 'fa-solid fa-undo';
    }
    else if (log.event === 'strategy card activation undone') {
      message = `${createPlayerTag(log.user)} undid their activation of <ti-preview-link data-name="${log.details.strategyCardName}" data-type="strategy-card"></ti-preview-link>.`;
      iconClass = 'fa-solid fa-undo';
    }
    else {
        throw new Error(`Unrecognized event: "${log.event}"`);
    }

    const gameLogs = document.getElementById('game-logs');

    // Don't scroll to bottom if user is scrolling through history
    const shouldScroll = isScrolledToBottom(gameLogs);

    const timestamp = dateTimeFormatShort.format(new Date(log.time));
    const title = dateTimeFormatLong.format(new Date(log.time));

    const gameLogTemplate = `
        <div id="${log._id}" class="game-log">
            <div class="icon">
                <i class="${iconClass}"></i>
            </div>
            <div class="bubble">
                <div class="message">${message}</div>
                <div class="timestamp" title="${title}">${timestamp}</div>
            </div>
        </div>
    `;

    if (prepend) {
        $('#game-logs').prepend(gameLogTemplate);
    }
    else {
        $('#game-logs').append(gameLogTemplate);
    }

    if (isRollEvent(log)) {
        const results = document.createElement('span');
        results.className = 'roll-summary-link';
        results.innerText = 'Roll Summary';

        const player = getPlayerByUserId(log.user);
        const data = { results: log.details.results, color: player.color, faction: player.faction };
        $(results).data('results', data);
        $(`#game-logs > #${log._id} .message`).after(results);
    }

    const cost = getCost(log);

    if (cost.tradeGoods > 0 || cost.planetNames.length > 0 || cost.agendaNames.length > 0) {
        const costSummary = document.createElement('span');
        costSummary.className = 'cost-summary-link';
        costSummary.innerText = 'Cost Summary';

        costSummary.addEventListener('click', () => {
            const modal = document.createElement('ti-spending-modal');
            modal.setAttribute('readonly', 'readonly');
            attachTextSlot(modal, 'title', 'Cost Summary');
            attachTextSlot(modal, 'button', 'CLOSE');

            modal.addEventListener('close', () => {
                modal.remove();
            });

            modal.addEventListener('send', () => {
                modal.remove();
            });

            const planetCards = cost.planetNames.map(planetName => ({ name: planetName }));
            modal.data = { tradeGoods: { initial: cost.tradeGoods }, planetCards, agendaNames: cost.agendaNames };
            document.body.append(modal);
        });

        $(`#game-logs > #${log._id} .message`).after(costSummary);
    }

    if (shouldScroll) {
        scrollToBottom(gameLogs);
    }
}

function writeErrorLog(log, prepend) {
    if (!log || !initialized) return;

    const gameLogs = document.getElementById('game-logs');

    // Don't scroll to bottom if user is scrolling through history
    const shouldScroll = isScrolledToBottom(gameLogs);

    const timestamp = dateTimeFormatShort.format(new Date(log.time));
    const title = dateTimeFormatLong.format(new Date(log.time));

    const gameLogTemplate = `
        <div id="${log._id}" class="game-log">
            <div class="icon">
                <i class="fa-solid fa-exclamation-circle"></i>
            </div>
            <div class="bubble">
                <div class="message">
                    <i>Error loading game log.</i>
                </div>
                <div class="timestamp" title="${title}">${timestamp}</div>
            </div>
        </div>
    `;

    if (prepend) {
        $('#game-logs').prepend(gameLogTemplate);
    }
    else {
        $('#game-logs').append(gameLogTemplate);
    }

    if (shouldScroll) {
        scrollToBottom(gameLogs);
    }
}

function writeGameLogs(logs) {
    logs.forEach(log => {
        try {
            writeGameLog(log, true);
        }
        catch (error) {
            console.error(error);
            writeErrorLog(log, true);
        }
    });
}

async function initializeGameLogs() {
    let logs;

    try {
        logs = await getGameLogs();
    }
    catch (error) {
        console.error(error);
        return false;
    }

    const gameLogs = document.getElementById('game-logs');
    gameLogs.classList.remove('hidden');
    initialized = true;
    writeGameLogs(logs);
    scrollToBottom(gameLogs);

    gameLogs.onscroll = async function() {
        if (isLoading || reachedEnd) return;

        if (gameLogs.scrollTop < 100) {
            isLoading = true;

            const loadingIndicator = createLoadingIndicator();
            gameLogs.prepend(loadingIndicator);

            const lastLogId = $('.game-log').first().attr('id');
            const logs = await getGameLogs(lastLogId);

            loadingIndicator.remove();

            // Scroll down slightly so scroll doesn't get stuck to top when new logs are prepended
            if (gameLogs.scrollTop === 0) {
                gameLogs.scrollTop = 1;
            }

            if (logs.length > 0) {
                writeGameLogs(logs);
            }

            if (logs.length < 25) {
                reachedEnd = true;
            }

            isLoading = false;
        }
    };

    return true;
}

function isRollEvent(log) {
    const event = log.event;

    return event === 'space cannon offense rolled' ||
        event === 'anti-fighter barrage rolled' ||
        event === 'space combat rolled' ||
        event === 'bombardment rolled' ||
        event === 'space cannon defense rolled' ||
        event === 'ground combat rolled' ||
        event === 'plague rolled' ||
        event === 'rolled for destroyed infantry' ||
        (event === 'faction ability used' && log.details.ability === 'Ambush');
}

function getCost(log) {
    let tradeGoods = 0;
    let planetNames = [];
    let agendaNames = [];

    const isCostEvent = log.event === 'units produced' ||
        log.event === 'custodians token removed' ||
        (log.event === 'primary ability resolved' || log.event === 'secondary ability resolved') && log.details.strategyCard === 'Leadership' ||
        (log.event === 'primary ability resolved' || log.event === 'secondary ability resolved') && log.details.strategyCard === 'Technology' ||
        log.event === 'second technology researched' ||
        log.event === 'secondary ability resolved' && log.details.strategyCard === 'Warfare' ||
        log.event === 'technology card played' && (log.details.technologyName === 'Chaos Mapping' || log.details.technologyName === 'Integrated Economy' || log.details.technologyName === 'Salvage Operations' || log.details.technologyName === 'Sling Relay') ||
        log.event === 'component action card played' && (log.details.actionCardName === 'Impersonation' || log.details.actionCardName === 'Plagiarize') ||
        log.event === 'flagship ability used' && (log.details.flagship === 'Duha Menaimon' || log.details.flagship === 'Dynamo') ||
        log.event === 'mech ability used' && (log.details.faction === Faction.BaronyOfLetnev || log.details.faction === Faction.FederationOfSol) ||
        log.event === 'faction ability used' && log.details.ability === 'Indoctrination' ||
        log.event === 'JR-XS455-0 resolved' && log.details.placedStructure;

    if (isCostEvent && log.details && log.details.requirements) {
        tradeGoods = log.details.requirements.tradeGoods || 0;

        if (log.details.requirements.planets) {
            log.details.requirements.planets.forEach(planet => {
                if (typeof planet !== 'string' || planetNames.includes(planet)) return;
                planetNames.push(planet);
            });
        }

        if (log.details.requirements.resourcePlanets) {
            log.details.requirements.resourcePlanets.forEach(resourcePlanet => {
                if (typeof resourcePlanet !== 'string' || planetNames.includes(resourcePlanet)) return;
                planetNames.push(resourcePlanet);
            });
        }

        if (log.details.requirements.influencePlanets) {
            log.details.requirements.influencePlanets.forEach(influencePlanet => {
                if (typeof influencePlanet !== 'string' || planetNames.includes(influencePlanet)) return;
                planetNames.push(influencePlanet);
            });
        }

        if (log.details.requirements.techPlanets) {
            log.details.requirements.techPlanets.forEach(techPlanet => {
                if (typeof techPlanet !== 'string' || planetNames.includes(techPlanet)) return;
                planetNames.push(techPlanet);
            });
        }

        if (log.details.requirements.researchTeams) {
            log.details.requirements.researchTeams.forEach(researchTeam => {
                if (typeof researchTeam !== 'string') return;
                agendaNames.push(researchTeam);
            });
        }
    }

    return { tradeGoods, planetNames, agendaNames };
}

function constructPrimaryAbilityLog(userId, strategyCard, requirements) {
    let message = `${createPlayerTag(userId)} resolved the primary ability of <ti-preview-link data-name="${strategyCard}" data-type="strategy-card"></ti-preview-link>`;

    if (strategyCard === 'Leadership') {
        message += ` and gained ${printCommandTokenList(requirements)}.`;
    }
    else if (strategyCard === 'Diplomacy') {
        if (requirements.system) {
            const systemNumber = requirements.system;
            const systemName = getSystemNameByNumber(systemNumber);
            message += `, chose the <span class="system-link" data-number="${systemNumber}">${systemName}</span>,`;
        }

        if (requirements.planets && requirements.planets.length > 0) {
            message += ` and readied <ti-preview-link class="planet-link" data-name="${requirements.planets[0]}" data-type="planet-card"></ti-preview-link>`;

            if (requirements.planets.length === 2) {
                message += ` and <ti-preview-link class="planet-link" data-name="${requirements.planets[1]}" data-type="planet-card"></ti-preview-link>`;
            }
        }
        else {
            message += ' and did not ready any planet cards';
        }

        message += '.';
    }
    else if (strategyCard === 'Politics') {
        const chosenPlayer = getPlayerByNumber(requirements.speaker);
        message = `${createPlayerTag(userId)} chose ${createPlayerTag(chosenPlayer.user._id)} to gain the speaker token.`;
    }
    else if (strategyCard === 'Construction') {
        if (requirements.structure1) {
            const unitName = requirements.structure1.unitName === 'PDS' ? 'PDS' : 'space dock';
            const planetOne = getPlanetName(requirements.structure1.newStructure.planetId);
            message += ` and placed 1 ${unitName} on <ti-preview-link class="planet-link" data-name="${planetOne}" data-type="planet-card"></ti-preview-link>`;

            if (requirements.structure2) {
                const planetTwo = getPlanetName(requirements.structure2.newStructure.planetId);
                message += ` and 1 PDS on <ti-preview-link class="planet-link" data-name="${planetTwo}" data-type="planet-card"></ti-preview-link>`;
            }
        }

        message += '.';
    }
    else if (strategyCard === 'Trade') {
        message = `${createPlayerTag(userId)} gained 3 trade goods.`;
    }
    else if (strategyCard === 'Warfare') {
        if (requirements.system) {
            const systemNumber = requirements.system;
            const systemName = getSystemNameByNumber(systemNumber);
            message += ` to remove a command token from the <span class="system-link" data-number="${systemNumber}">${systemName}</span> `;
        }

        message += 'and redistributed their tokens to place ';
        message += requirements.tactic === 1 ? '1 token in their tactic pool, ' : `${requirements.tactic} tokens in their tactic pool, `;
        message += requirements.fleet === 1 ? '1 token in their fleet pool, ' : `${requirements.fleet} tokens in their fleet pool, `;
        message += requirements.strategy === 1 ? 'and 1 token in their strategy pool.' : `and ${requirements.strategy} tokens in their strategy pool.`;
    }
    else if (strategyCard === 'Technology') {
        if (requirements.commandTokens) {
            message = `${createPlayerTag(userId)} gained ${printCommandTokenList(requirements.commandTokens)}.`;
        }
        else if (requirements.technology) {
            message = `${createPlayerTag(userId)} researched <ti-preview-link data-name="${requirements.technology}" data-type="technology-card"></ti-preview-link> for their first technology.`;
        }
        else {
            message += '.';
        }
    }
    else if (strategyCard === 'Imperial') {
        if (requirements.objectiveName) {
            message += ` and scored the <ti-preview-link data-name="${requirements.objectiveName}" data-type="objective-card"></ti-preview-link> objective`;
        }

        if (requirements.scoredImperialPoint) {
            message += ' and gained 1 victory point for controlling Mecatol Rex';
        }
        else if (requirements.drewSecretObjective) {
            message += ' and drew 1 secret objective';
        }

        message += '.';
    }
    else {
        message += '.';
    }

    return message;
}

function constructOrderTopTwoAgendasLog(userId, requirements) {
    // Handling for backwards compatibility of different data types in the log
    const agendasOnTop = isNaN(requirements.agendas.top) ?
        requirements.agendas.top.length :
        requirements.agendas.top;

    const agendasOnBottom = isNaN(requirements.agendas.bottom) ?
        requirements.agendas.bottom.length :
        requirements.agendas.bottom;

    if (agendasOnTop === 2) {
        return `${createPlayerTag(userId)} placed the 2 agendas at the top of the deck.`;
    }
    else if (agendasOnBottom === 2) {
        return `${createPlayerTag(userId)} placed the 2 agendas at the bottom of the deck.`;
    }
    else {
        return `${createPlayerTag(userId)} placed 1 agenda at the top of the deck and 1 agenda at the bottom of the deck.`;
    }
}

function constructPlayersToReplenishCommoditiesLog(userId, playerNumbers) {
    let message;

    if (playerNumbers && playerNumbers.length > 0) {
        message = `${createPlayerTag(userId)} chose`;

        playerNumbers.forEach((playerNumber, index) => {
            if (index > 0 && index === playerNumbers.length - 1) {
                message += ' and';
            }

            const chosenPlayer = getPlayerByNumber(playerNumber);

            message += ` ${createPlayerTag(chosenPlayer.user._id)}`;

            if (index !== playerNumbers.length - 1 && playerNumbers.length > 2) {
                message += ',';
            }
        });

        message += ' to use the secondary ability without spending a command token.';
    }
    else {
        message = `${createPlayerTag(userId)} did not choose any players to use the secondary ability without spending a command token.`;
    }

    return message;
}

function constructSecondTechnologyResearchLog(userId, requirements) {
    if (requirements.commandTokens) {
        return `${createPlayerTag(userId)} gained ${printCommandTokenList(requirements.commandTokens)}.`;
    }
    else {
        return `${createPlayerTag(userId)} researched <ti-preview-link data-name="${requirements.technology}" data-type="technology-card"></ti-preview-link> for their second technology.`;
    }
}

function constructSecondaryAbilityLog(userId, strategyCard, requirements) {
    let message = `${createPlayerTag(userId)} resolved the secondary ability of <ti-preview-link data-name="${strategyCard}" data-type="strategy-card"></ti-preview-link>`;

    if (strategyCard === 'Leadership') {
        message += ` and gained ${printCommandTokenList(requirements)}.`;
    }
    else if (strategyCard === 'Diplomacy') {
        if (requirements.planets && requirements.planets.length > 0) {
            message += ` and readied <ti-preview-link class="planet-link" data-name="${requirements.planets[0]}" data-type="planet-card"></ti-preview-link>`;

            if (requirements.planets.length === 2) {
                message += ` and <ti-preview-link class="planet-link" data-name="${requirements.planets[1]}" data-type="planet-card"></ti-preview-link>`;
            }
        }
        else {
            message += ' and did not ready any planet cards';
        }

        message += '.';
    }
    else if (strategyCard === 'Construction') {
        const unitName = requirements.unitName === 'PDS' ? 'PDS' : 'space dock';
        const planetName = getPlanetName(requirements.newStructure.planetId);
        message += ` and placed 1 ${unitName} on <ti-preview-link class="planet-link" data-name="${planetName}" data-type="planet-card"></ti-preview-link>.`;
    }
    else if (strategyCard === 'Warfare') {
        const unitList = printUnitList(requirements.units);
        message += ` and produced ${unitList}.`;
    }
    else if (strategyCard === 'Technology') {
        message += requirements.commandTokens ?
            ` and gained ${printCommandTokenList(requirements.commandTokens)}.` :
            ` and researched <ti-preview-link data-name="${requirements.technology}" data-type="technology-card"></ti-preview-link>.`;
    }
    else {
        message += '.';
    }

    return message;
}

function constructActionCardLog(userId, actionCard, requirements) {
    let message = `${createPlayerTag(userId)} played the <ti-preview-link data-name="${actionCard}" data-type="action-card"></ti-preview-link> action card`;

    if (actionCard === 'In the Silence of Space') {
        const systemNumber = requirements.systemNumber;
        const systemName = getSystemNameByNumber(systemNumber);
        message += ` and chose the <span class="system-link" data-number="${systemNumber}">${systemName}</span>.`;
    }
    else if (actionCard === 'Forward Supply Base') {
        const chosenPlayer = getPlayerByNumber(requirements.playerNumber);
        message += ` and chose ${createPlayerTag(chosenPlayer.user._id)} to gain 1 trade good.`;
    }
    else if (isRider(actionCard)) {
        let outcome = requirements.outcome;

        // If the outcome is a number, then it represents a player number for a player election
        if (!isNaN(requirements.outcome)) {
            const player = getPlayerByNumber(requirements.outcome);
            outcome = createPlayerTag(player.user._id);
        }

        message += ` and predicted the outcome: ${outcome}.`;
    }
    else if (actionCard === 'Assassinate Representative') {
        const chosenPlayer = getPlayerByNumber(requirements.playerNumber);
        message += ` and chose ${createPlayerTag(chosenPlayer.user._id)}.`;
    }
    else if (actionCard === 'Decoy Operation') {
        const unitName = requirements.unitName1.toLowerCase();
        message += ` and chose to remove 1 ${unitName} from`;

        if (requirements.systemNumber1) {
            const systemNumber = requirements.systemNumber1;
            const systemName = getSystemNameByNumber(systemNumber);
            message += ` the space area of the <span class="system-link" data-number="${systemNumber}">${systemName}</span>`;
        }
        else {
            message += ` <ti-preview-link class="planet-link" data-name="${requirements.planetName1}" data-type="planet-card"></ti-preview-link>`;
        }

        if (requirements.unitId2) {
            const unitName = requirements.unitName2.toLowerCase();
            message += ` and 1 ${unitName} from`;

            if (requirements.systemNumber2) {
                const systemNumber = requirements.systemNumber2;
                const systemName = getSystemNameByNumber(systemNumber);
                message += ` the space area of the <span class="system-link" data-number="${systemNumber}">${systemName}</span>`;
            }
            else {
                message += ` <ti-preview-link class="planet-link" data-name="${requirements.planetName2}" data-type="planet-card"></ti-preview-link>`;
            }
        }

        message += ` and place them on <ti-preview-link class="planet-link" data-name="${requirements.planetName}" data-type="planet-card"></ti-preview-link>.`;
    }
    else if (actionCard === 'Diplomatic Pressure') {
        const chosenPlayer = getPlayerByNumber(requirements.playerNumber);
        message += ` and chose ${createPlayerTag(chosenPlayer.user._id)} to give them 1 promissory note.`;
    }
    else {
        message += '.';
    }

    return message;
}

function constructComponentActionLog(userId, actionCard, requirements) {
    let message = `${createPlayerTag(userId)} played the <ti-preview-link data-name="${actionCard}" data-type="action-card"></ti-preview-link> action card`;

    if (actionCard === 'Ghost Ship' || actionCard === 'Tactical Bombardment' || actionCard === 'Unexpected Action' || actionCard === 'War Effort') {
        const systemNumber = requirements.systemNumber;
        const systemName = getSystemNameByNumber(systemNumber);
        message += ` and chose the <span class="system-link" data-number="${systemNumber}">${systemName}</span>.`;
    }
    else if (actionCard === 'Insubordination' || actionCard === 'Spy') {
        const chosenPlayer = getPlayerByNumber(requirements.playerNumber);
        message += ` and chose ${createPlayerTag(chosenPlayer.user._id)}.`;
    }
    else if (actionCard === 'Plague') {
        message += ` and chose <ti-preview-link class="planet-link" data-name="${requirements.planetName}" data-type="planet-card"></ti-preview-link>`;

        if (!isNaN(requirements.numberOfInfantry)) {
            message += ` with ${requirements.numberOfInfantry} infantry on it`;
        }

        message += '.';
    }
    else if (actionCard === 'Cripple Defenses') {
        message += ` and chose <ti-preview-link class="planet-link" data-name="${requirements.planetName}" data-type="planet-card"></ti-preview-link>`;

        if (!isNaN(requirements.numberOfPDS)) {
            message += ` with ${requirements.numberOfPDS} PDS on it`;
        }

        message += '.';
    }
    else if (actionCard === 'Frontline Deployment' || actionCard === 'Unstable Planet') {
        message += ` and chose <ti-preview-link class="planet-link" data-name="${requirements.planetName}" data-type="planet-card"></ti-preview-link>.`;
    }
    else if (actionCard === 'Mining Initiative' || actionCard === 'Uprising') {
        message += ` and chose <ti-preview-link class="planet-link" data-name="${requirements.planetName}" data-type="planet-card"></ti-preview-link>.`;
    }
    else if (actionCard === 'Lucky Shot') {
        const systemNumber = requirements.systemNumber;
        const systemName = getSystemNameByNumber(systemNumber);
        message += ` and chose to destroy a ${requirements.unitName} in the <span class="system-link" data-number="${systemNumber}">${systemName}</span>.`;
    }
    else if (actionCard === 'Plagiarize') {
        message += ` and chose to gain the <ti-preview-link data-name="${requirements.technologyName}" data-type="technology-card"></ti-preview-link> technology.`;
    }
    else if (actionCard === 'Reactor Meltdown') {
        if (requirements.planetName) {
            message += ` and chose the space dock on <ti-preview-link class="planet-link" data-name="${requirements.planetName}" data-type="planet-card"></ti-preview-link>.`;
        }
        else if (requirements.systemNumber) {
            const systemNumber = requirements.systemNumber;
            const systemName = getSystemNameByNumber(systemNumber);
            message += ` and chose the space dock in the <span class="system-link" data-number="${systemNumber}">${systemName}</span>.`;
        }
    }
    else if (actionCard === 'Repeal Law') {
        message += ` and chose to discard <ti-preview-link data-name="${requirements.law}" data-type="agenda-card"></ti-preview-link>.`;
    }
    else if (actionCard === 'Signal Jamming') {
        const chosenPlayer = getPlayerByNumber(requirements.playerNumber);
        const systemNumber = requirements.systemNumber;
        const systemName = getSystemNameByNumber(systemNumber);
        message += ` and chose ${createPlayerTag(chosenPlayer.user._id)} to place a command token in the <span class="system-link" data-number="${systemNumber}">${systemName}</span>.`;
    }
    else if (actionCard === 'Scuttle') {
        const systemNumber = requirements.systemNumber1;
        const systemName = getSystemNameByNumber(systemNumber);
        const unitName = requirements.unitName1.toLowerCase();
        message += ` and chose to remove 1 ${unitName} in the <span class="system-link" data-number="${systemNumber}">${systemName}</span>`;

        if (requirements.unitId2) {
            const systemNumber = requirements.systemNumber2;
            const systemName = getSystemNameByNumber(systemNumber);
            const unitName = requirements.unitName2.toLowerCase();
            message += ` and 1 ${unitName} in the <span class="system-link" data-number="${systemNumber}">${systemName}</span>`;
        }

        message += requirements.cost === 1 ? ` to gain 1 trade good.` : ` to gain ${requirements.cost} trade goods.`;
    }
    else if (actionCard === 'Exploration Probe') {
        const systemNumber = requirements.systemNumber;
        const systemName = getSystemNameByNumber(systemNumber);
        message += ` and chose to explore the frontier token in the <span class="system-link" data-number="${systemNumber}">${systemName}</span>.`;
    }
    else if (actionCard === 'Seize Artifact') {
        const chosenPlayer = getPlayerByNumber(requirements.playerNumber);
        const name = getRelicFragmentNameByType(requirements.type);
        message += ` and chose ${createPlayerTag(chosenPlayer.user._id)} to give them 1 <ti-preview-link data-name="${name}" data-type="exploration" data-exploration-type="${requirements.type}"></ti-preview-link>.`;
    }
    else if (actionCard === 'Archaeological Expedition') {
        message += ` and chose to reveal the top 3 cards of the ${requirements.type.toLowerCase()} exploration deck.`;
    }
    else {
        message += '.';
    }

    return message;
}

function constructTradeLog(tradeRequest) {
    const toPlayer = getPlayerByNumber(tradeRequest.to);
    const fromPlayer = getPlayerByNumber(tradeRequest.from);

    let tradeMessage = '';

    if (!isTradeComponentsEmpty(tradeRequest.offer) && !isTradeComponentsEmpty(tradeRequest.request)) {
        tradeMessage += `${createPlayerTag(fromPlayer.user._id)} traded`;
        tradeMessage += printTradeComponents(tradeRequest.offer);
        tradeMessage += ` to ${createPlayerTag(toPlayer.user._id)} in exchange for`;
        tradeMessage += printTradeComponents(tradeRequest.request);
        tradeMessage += '.';
    }
    else if (!isTradeComponentsEmpty(tradeRequest.offer) && isTradeComponentsEmpty(tradeRequest.request)) {
        tradeMessage += `${createPlayerTag(fromPlayer.user._id)} traded`;
        tradeMessage += printTradeComponents(tradeRequest.offer);
        tradeMessage += ` to ${createPlayerTag(toPlayer.user._id)}.`;
    }
    else if (isTradeComponentsEmpty(tradeRequest.offer) && !isTradeComponentsEmpty(tradeRequest.request)) {
        tradeMessage += `${createPlayerTag(toPlayer.user._id)} traded`;
        tradeMessage += printTradeComponents(tradeRequest.request);
        tradeMessage += ` to ${createPlayerTag(fromPlayer.user._id)}.`;
    }

    return tradeMessage;
}

function constructScuttleLog(userId, systems) {
    let message = `${createPlayerTag(userId)} scuttled`;

    systems.forEach((system, index) => {
        if (index > 0 && index === systems.length - 1) {
            message += ' and';
        }

        if (system.planetName) {
            message += ` ${printUnitList(system.units)} on <ti-preview-link class="planet-link" data-name="${system.planetName}" data-type="planet-card"></ti-preview-link>`;
        }
        else {
            const systemNumber = system.number;
            const systemName = getSystemNameByNumber(systemNumber);
            message += ` ${printUnitList(system.units)} in the space area of the <span class="system-link" data-number="${systemNumber}">${systemName}</span>`;
        }

        if (index !== systems.length - 1 && systems.length > 2) {
            message += ',';
        }
    });

    message += '.';

    return message;
}

function constructMovementLog(userId, departedSystems) {
    if (departedSystems.length === 0) {
        return `${createPlayerTag(userId)} did not move any units into the active system.`;
    }

    let message = `${createPlayerTag(userId)} moved`;

    departedSystems.forEach((departedSystem, index) => {
        if (index > 0 && index === departedSystems.length - 1) {
            message += ' and';
        }

        const systemNumber = departedSystem.number;
        const systemName = getSystemNameByNumber(systemNumber);
        message += ` ${printUnitList(departedSystem.units)} from the <span class="system-link" data-number="${systemNumber}">${systemName}</span>`;

        if (index !== departedSystems.length - 1 && departedSystems.length > 2) {
            message += ',';
        }
    });

    message += ' into the active system.';

    return message;
}

function constructHitsAssignedLog(userId, details) {
    const unitList = printUnitList(details.units);
    return `${createPlayerTag(userId)} assigned hits to ${unitList}.`;
}

function constructBombardmentLog(userId, hitsProduced) {
    let message = `${createPlayerTag(userId)} rolled dice for Bombardment and produced`;

    hitsProduced.forEach((hitProduced, index) => {
        if (index > 0 && index === hitsProduced.length - 1) {
            message += ' and';
        }

        message += hitProduced.hits === 1 ?
            ` 1 hit on <ti-preview-link class="planet-link" data-name="${hitProduced.planetName}" data-type="planet-card"></ti-preview-link>` :
            ` ${hitProduced.hits} hits on <ti-preview-link class="planet-link" data-name="${hitProduced.planetName}" data-type="planet-card"></ti-preview-link>`;

        if (index === hitsProduced.length - 1) {
            message += '.';
        }
        else if (hitsProduced.length > 2) {
            message += ',';
        }
    });

    return message;
}

function constructBombardmentHitsAssignedLog(userId, details) {
    const unitList = printUnitList(details.units);
    return `${createPlayerTag(userId)} assigned hits to ${unitList} on <ti-preview-link class="planet-link" data-name="${details.planetName}" data-type="planet-card"></ti-preview-link>.`;
}

function constructCommitGroundForcesLog(userId, details) {
    if (details.planetNames.length === 0) {
        return `${createPlayerTag(userId)} did not commit any ground forces.`;
    }

    let message = `${createPlayerTag(userId)} committed ground forces to`;

    details.planetNames.forEach((planetName, index) => {
        if (index > 0 && index === details.planetNames.length - 1) {
            message += ' and';
        }

        message += ` <ti-preview-link class="planet-link" data-name="${planetName}" data-type="planet-card"></ti-preview-link>`;

        if (index === details.planetNames.length - 1) {
            message += '.';
        }
        else if (details.planetNames.length > 2) {
            message += ',';
        }
    });

    return message;
}

function constructSpaceCannonDefenseRolledLog(userId, details) {
    const hitsProducedText = details.hitsProduced === 1 ? '1 hit' : `${details.hitsProduced} hits`;
    return `${createPlayerTag(userId)} rolled dice for Space Cannon Defense on <ti-preview-link class="planet-link" data-name="${details.planetName}" data-type="planet-card"></ti-preview-link> and produced ${hitsProducedText}.`;
}

function constructEstablishControlLog(userId, planetNames) {
    let message = `${createPlayerTag(userId)} established control of`;

    planetNames.forEach((planetName, index) => {
        if (index > 0 && index === planetNames.length - 1) {
            message += ' and';
        }

        message += ` <ti-preview-link class="planet-link" data-name="${planetName}" data-type="planet-card"></ti-preview-link>`;

        if (index === planetNames.length - 1) {
            message += '.';
        }
        else if (planetNames.length > 2) {
            message += ',';
        }
    });

    return message;
}

function constructAgendaLog(userId, agendaName, requirements) {
    let message = `${createPlayerTag(userId)} played the <ti-preview-link data-name="${agendaName}" data-type="agenda-card"></ti-preview-link> agenda card`;

    if (agendaName === 'Minister of War') {
        const systemNumber = requirements.systemNumber;
        const systemName = getSystemNameByNumber(systemNumber);
        message += ` and removed one command token from the <span class="system-link" data-number="${systemNumber}">${systemName}</span>.`;
    }
    else if (agendaName === 'Minister of Exploration' || agendaName === 'Minister of Commerce') {
        message += requirements.tradeGoods === 1 ?
            ' and gained 1 trade good.' :
            ` and gained ${requirements.tradeGoods} trade goods.`;
    }
    else if (agendaName === 'Imperial Arbiter') {
        const chosenPlayer = getPlayerByNumber(requirements.chosenPlayerNumber);
        message += ` and gave <ti-preview-link data-name="${requirements.givenStrategyCardName}" data-type="strategy-card"></ti-preview-link> to ${createPlayerTag(chosenPlayer.user._id)} in exchange for <ti-preview-link data-name="${requirements.takenStrategyCardName}" data-type="strategy-card"></ti-preview-link>.`;
    }
    else {
        message += '.';
    }

    return message;
}

function constructPlayerLawGainedLog(userId, agendaName) {
    return `${createPlayerTag(userId)} gained the <ti-preview-link data-name="${agendaName}" data-type="agenda-card"></ti-preview-link> agenda card.`;
}

function constructRelicCardGainedLog(userId, relicName) {
    return `${createPlayerTag(userId)} gained the <ti-preview-link data-name="${relicName}" data-type="relic"></ti-preview-link> relic card.`;
}

function constructTechnologyLog(userId, technologyName, requirements, count) {
    let message = `${createPlayerTag(userId)} played the <ti-preview-link data-name="${technologyName}" data-type="technology-card"></ti-preview-link> technology card`;

    if (technologyName === 'Transit Diodes') {
        message += ' to remove';

        const removed = [...requirements.removedPlanets];

        // Check required for backward compatibility before ground forces could be removed from space areas
        if (requirements.removedSpaceAreas) {
            removed.push(...requirements.removedSpaceAreas);
        }

        removed.forEach((removal, index) => {
            if (index > 0 && index === removed.length - 1) {
                message += ' and';
            }

            if (removal.planetName) {
                message += removal.groundForces === 1 ?
                    ` 1 ground force from <ti-preview-link class="planet-link" data-name="${removal.planetName}" data-type="planet-card"></ti-preview-link>` :
                    ` ${removal.groundForces} ground forces from <ti-preview-link class="planet-link" data-name="${removal.planetName}" data-type="planet-card"></ti-preview-link>`;
            }
            else {
                const systemName = getSystemNameByNumber(removal.systemNumber);
                message += removal.groundForces === 1 ?
                    ` 1 ground force from the space area of the <span class="system-link" data-number="${removal.systemNumber}">${systemName}</span>` :
                    ` ${removal.groundForces} ground forces from the space area of the <span class="system-link" data-number="${removal.systemNumber}">${systemName}</span>`;
            }

            if (index !== removed.length - 1 && removed.length > 2) {
                message += ',';
            }
        });

        message += ' and place';

        requirements.addedPlanets.forEach((addedPlanet, index) => {
            if (index > 0 && index === requirements.addedPlanets.length - 1) {
                message += ' and';
            }

            if (addedPlanet.groundForces === 1) {
                message += ` ${addedPlanet.groundForces} ground force on <ti-preview-link class="planet-link" data-name="${addedPlanet.planetName}" data-type="planet-card"></ti-preview-link>`;
            }
            else {
                message += ` ${addedPlanet.groundForces} ground forces on <ti-preview-link class="planet-link" data-name="${addedPlanet.planetName}" data-type="planet-card"></ti-preview-link>`;
            }

            if (index === requirements.addedPlanets.length - 1) {
                message += '.';
            }
            else if (requirements.addedPlanets.length > 2) {
                message += ',';
            }
        });
    }
    else if (technologyName === 'Integrated Economy') {
        message += ' and produced';

        requirements.planets.forEach((planet, index) => {
            if (index > 0 && index === requirements.planets.length - 1) {
                message += ' and';
            }

            if (planet.units) {
                const unitList = printUnitList(planet.units);
                message += ` ${unitList} on <ti-preview-link class="planet-link" data-name="${planet.planetName}" data-type="planet-card"></ti-preview-link>`;
            }
            else {
                message += ` no units on <ti-preview-link class="planet-link" data-name="${planet.planetName}" data-type="planet-card"></ti-preview-link>`;
            }

            if (index !== requirements.planets.length - 1 && requirements.planets.length > 2) {
                message += ',';
            }
        });

        message += '.';
    }
    else if (technologyName === 'Exotrireme II') {
        requirements.destroyedShipNames.forEach((destroyedShipName, index) => {
            message += index === 0 ? ' and destroyed' : ' and';
            message += ` a ${destroyedShipName}`;
        });

        message += '.';
    }
    else if (technologyName === 'Production Biomes') {
        const chosenPlayer = getPlayerByNumber(requirements.chosenPlayerNumber);
        message += ` and chose ${createPlayerTag(chosenPlayer.user._id)} to gain 2 trade goods.`;
    }
    else if (technologyName === 'Quantum Datahub Node') {
        const chosenPlayer = getPlayerByNumber(requirements.playerNumber);
        message += ` and gave <ti-preview-link data-name="${requirements.givenStrategyCardName}" data-type="strategy-card"></ti-preview-link> to ${createPlayerTag(chosenPlayer.user._id)} in exchange for <ti-preview-link data-name="${requirements.takenStrategyCardName}" data-type="strategy-card"></ti-preview-link>.`;
    }
    else if (technologyName === 'Chaos Mapping') {
        const systemNumber = requirements.systemNumber;
        const systemName = getSystemNameByNumber(systemNumber);
        message += ` and produced 1 ${requirements.unitName} in the <span class="system-link" data-number="${systemNumber}">${systemName}</span>.`;
    }
    else if (technologyName === 'Mageon Implants') {
      const chosenPlayer = getPlayerByNumber(requirements.chosenPlayerNumber);
      message += ` and chose to steal from ${createPlayerTag(chosenPlayer.user._id)}.`;
    }
    else if (technologyName === 'Hegemonic Trade Policy') {
        message += ` and swapped the resource and influence values of <ti-preview-link class="planet-link" data-name="${requirements.planetName}" data-type="planet-card"></ti-preview-link>.`;
    }
    else if (technologyName === 'Instinct Training') {
        message += ` and cancelled the <ti-preview-link data-name="${requirements.actionCardName}" data-type="action-card"></ti-preview-link> action card.`;
    }
    else if (technologyName === 'Bioplasmosis') {
        message += ' to remove';

        const fromPlanets = requirements.placements.reduce((map, placement) => {
            const item = map.find(item => item.planetName === placement.fromPlanet);

            if (item) {
                item.infantry++;
            }
            else {
                map.push({ planetName: placement.fromPlanet, infantry: 1 });
            }

            return map;
        }, []);

        const toPlanets = requirements.placements.reduce((map, placement) => {
            const item = map.find(item => item.planetName === placement.toPlanet);

            if (item) {
                item.infantry++;
            }
            else {
                map.push({ planetName: placement.toPlanet, infantry: 1 });
            }

            return map;
        }, []);

        fromPlanets.forEach((fromPlanet, index) => {
            if (index > 0 && index === fromPlanets.length - 1) {
                message += ' and';
            }

            message += ` ${fromPlanet.infantry} infantry from <ti-preview-link class="planet-link" data-name="${fromPlanet.planetName}" data-type="planet-card"></ti-preview-link>`;

            if (index !== fromPlanets.length - 1 && fromPlanets.length > 2) {
                message += ',';
            }
        });

        message += ' and place';

        toPlanets.forEach((toPlanet, index) => {
            if (index > 0 && index === toPlanets.length - 1) {
                message += ' and';
            }

            message += ` ${toPlanet.infantry} infantry on <ti-preview-link class="planet-link" data-name="${toPlanet.planetName}" data-type="planet-card"></ti-preview-link>`;

            if (index === toPlanets.length - 1) {
                message += '.';
            }
            else if (toPlanets.length > 2) {
                message += ',';
            }
        });
    }
    else if (technologyName === 'Dimensional Splicer') {
        if (requirements.unit.name === UnitName.Infantry) {
            message += requirements.planetId ?
                ` and assigned 1 hit to an infantry on <ti-preview-link class="planet-link" data-name="${getPlanetName(requirements.planetId)}" data-type="planet-card"></ti-preview-link>.` :
                ` and assigned 1 hit to an infantry in the space area.`;
        }
        else if (requirements.unit.name === UnitName.Mech) {
            const damagedState = requirements.unit.sustainDamage.used ? 'a damaged' : 'an undamaged';
            message += requirements.planetId ?
                ` and assigned 1 hit to ${damagedState} mech on <ti-preview-link class="planet-link" data-name="${getPlanetName(requirements.planetId)}" data-type="planet-card"></ti-preview-link>.` :
                ` and assigned 1 hit to ${damagedState} mech in the space area.`;
        }
        else if (requirements.unit.sustainDamage) {
            message += requirements.unit.sustainDamage.used ?
                ` and assigned 1 hit to a damaged ${requirements.unit.name.toLowerCase()}.` :
                ` and assigned 1 hit to an undamaged ${requirements.unit.name.toLowerCase()}.`;
        }
        else {
            message += ` and assigned 1 hit to a ${requirements.unit.name.toLowerCase()}.`;
        }
    }
    else if (technologyName === 'Wormhole Generator') {
        const systemNumber = requirements.systemNumber;
        const systemName = getSystemNameByNumber(systemNumber);
        message += requirements.moved ?
            ` and moved the ${requirements.type} wormhole token to the <span class="system-link" data-number="${systemNumber}">${systemName}</span>.` :
            ` and placed the ${requirements.type} wormhole token in the <span class="system-link" data-number="${systemNumber}">${systemName}</span>.`;
    }
    else if (technologyName === 'Salvage Operations') {
        if (requirements) {
            const systemNumber = requirements.systemNumber;
            const systemName = getSystemNameByNumber(systemNumber);

            if (!requirements.unitName) {
                message += ` but chose not to produce a unit in the <span class="system-link" data-number="${systemNumber}">${systemName}</span>.`;
            }
            else {
                const unitName = requirements.unitName.toLowerCase();
                message += ` and produced 1 ${unitName} in the <span class="system-link" data-number="${systemNumber}">${systemName}</span>`;

                if (requirements.scuttleSystemNumber) {
                    const scuttleSystemNumber = requirements.scuttleSystemNumber;
                    const scuttleSystemName = getSystemNameByNumber(scuttleSystemNumber);
                    message += ` by scuttling 1 ${unitName} in the <span class="system-link" data-number="${scuttleSystemNumber}">${scuttleSystemName}</span>.`;
                }
                else {
                    message += '.';
                }
            }
        }
        else {
            message += ' and gained 1 trade good.';
        }
    }
    else if (technologyName === 'Impulse Core') {
        message += ` and chose to destroy a ${requirements.ship.toLowerCase()}.`;
    }
    else if (technologyName === 'Yin Spinner') {
        if (requirements.planetName) {
            message += ` and placed ${requirements.numberOfInfantry} infantry on <ti-preview-link class="planet-link" data-name="${requirements.planetName}" data-type="planet-card"></ti-preview-link>.`;
        }
        else {
            const systemName = getSystemNameByNumber(requirements.systemNumber);
            message += ` and placed ${requirements.numberOfInfantry} infantry in the space area of the <span class="system-link" data-number="${requirements.systemNumber}">${systemName}</span>.`;
        }
    }
    else if (technologyName === 'Self-Assembly Routines') {
        if (requirements && requirements.planetName) {
            message += ` and ${printUnitPlacementMessage(UnitName.Mech, null, requirements.planetName, requirements.scuttledSystemNumber, requirements.scuttledPlanetName)}.`;
        }
        else if (count) {
            message += count === 1 ? ' and gained 1 trade good.' : ` and gained ${count} trade goods (1 for each mech destroyed).`;
        }
    }
    else if (technologyName === 'Sling Relay') {
        const systemNumber = requirements.systemNumber;
        const systemName = getSystemNameByNumber(systemNumber);
        message += ` and produced 1 ${requirements.unitName.toLowerCase()} in the <span class="system-link" data-number="${systemNumber}">${systemName}</span>.`;
    }
    else if (technologyName === 'Psychoarchaeology') {
        message += ` and exhausted <ti-preview-link class="planet-link" data-name="${requirements.planetName}" data-type="planet-card"></ti-preview-link> to gain 1 trade good.`;
    }
    else if (technologyName === 'Bio-Stims') {
        if (requirements.planetName) {
            message += ` and readied <ti-preview-link class="planet-link" data-name="${requirements.planetName}" data-type="planet-card"></ti-preview-link>.`;
        }
        else {
            message += ` and readied <ti-preview-link data-name="${requirements.technologyName}" data-type="technology-card"></ti-preview-link>.`;
        }
    }
    else if (technologyName === 'Scanlink Drone Network') {
        message += ` and explored <ti-preview-link class="planet-link" data-name="${requirements.planetName}" data-type="planet-card"></ti-preview-link>.`;
    }
    else if (technologyName === 'Predictive Intelligence') {
        if (requirements) {
            message += ' and redistributed their tokens to place';
            message += requirements.tactic === 1 ? ' 1 token in their tactic pool,' : ` ${requirements.tactic} tokens in their tactic pool,`;
            message += requirements.fleet === 1 ? ' 1 token in their fleet pool,' : ` ${requirements.fleet} tokens in their fleet pool,`;
            message += requirements.strategy === 1 ? ' and 1 token in their strategy pool.' : ` and ${requirements.strategy} tokens in their strategy pool.`;
        }
        else {
            message += '.';
        }
    }
    else if (technologyName === 'Magen Defense Grid') {
        if (requirements.unit) {
            message += ` to produce 1 hit and assigned it to their opponent's`;

            if (requirements.unit.sustainDamage) {
                message += requirements.unit.sustainDamage.used ? ' damaged' : ' undamaged';
            }

            message += ` ${requirements.unit.name.toLowerCase()}.`;
        }
        else if (requirements.unitName) {
            message += ` to produce 1 hit and assigned it to their opponent's ${requirements.unitName.toLowerCase()}.`;
        }
        else {
            message += '.';
        }
    }
    else if (technologyName === 'Voidwatch') {
        const player = getPlayerByNumber(requirements.playerNumber);

        if (!requirements.hasPromissoryNoteToGive) {
            message += ` but ${createPlayerTag(player.user._id)} did not have any promissory notes they could give them.`;
        }
        else if (requirements.promissoryNote) {
            message += requirements.promissoryNote.color ?
                ` and received <ti-preview-link data-name="${requirements.promissoryNote.name}" data-color="${requirements.promissoryNote.color}" data-type="promissory-note"></ti-preview-link> from ${createPlayerTag(player.user._id)}.` :
                ` and received <ti-preview-link data-name="${requirements.promissoryNote.name}" data-faction="${requirements.promissoryNote.faction}" data-type="promissory-note"></ti-preview-link> from ${createPlayerTag(player.user._id)}.`;
        }
        else {
            message += ` and received 1 promissory note from ${createPlayerTag(player.user._id)}.`;
        }
    }
    else {
        message += '.';
    }

    return message;
}

function constructPromissoryNoteLog(userId, promissoryNote, requirements) {
    let message =  `${createPlayerTag(userId)} played the`;

    if (promissoryNote.color) {
        message += ` <ti-preview-link data-name="${promissoryNote.name}" data-color="${promissoryNote.color}" data-type="promissory-note"></ti-preview-link> promissory note`;
    }
    else {
        message += ` <ti-preview-link data-name="${promissoryNote.name}" data-faction="${promissoryNote.faction}" data-type="promissory-note"></ti-preview-link> promissory note`;
    }

    if (promissoryNote.name === "Military Support") {
        message += ` and placed 2 infantry on <ti-preview-link class="planet-link" data-name="${requirements.planetName}" data-type="planet-card"></ti-preview-link>`;
    }
    else if (promissoryNote.name === "Political Favor") {
        message += ` and revealed <ti-preview-link data-name="${requirements.agendaName}" data-type="agenda-card"></ti-preview-link> as the new agenda`;
    }
    else if (promissoryNote.name === "Ragh's Call") {
        message += ` and moved the Saar player's ground forces from <ti-preview-link class="planet-link" data-name="${requirements.fromPlanetName}" data-type="planet-card"></ti-preview-link> to <ti-preview-link class="planet-link" data-name="${requirements.toPlanetName}" data-type="planet-card"></ti-preview-link>`;
    }
    else if (promissoryNote.name === "Research Agreement") {
        message += ` and gained <ti-preview-link data-name="${requirements.technologyName}" data-type="technology-card"></ti-preview-link>`;
    }
    else if (promissoryNote.name === "Creuss Iff") {
        const systemNumber = requirements.systemNumber;
        const systemName = getSystemNameByNumber(systemNumber);
        message += requirements.moved ?
            ` and moved the ${requirements.type} wormhole token to the <span class="system-link" data-number="${systemNumber}">${systemName}</span>` :
            ` and placed the ${requirements.type} wormhole token in the <span class="system-link" data-number="${systemNumber}">${systemName}</span>`;
    }
    else if (promissoryNote.name === "Greyfire Mutagen") {
        message += ` and replaced 1 of their opponent's infantry with 1 infantry from their reinforcements`;
    }
    else if (promissoryNote.name === "Blood Pact") {
        if (requirements?.showAdditionalVotes) {
            message += ` and cast 4 additional votes for their outcome`;
        }
    }

    message += '.';

    return message;
}

function constructFactionAbilityLog(userId, ability, requirements) {
    let message = `${createPlayerTag(userId)} used the ${ability} faction ability`;

    if (ability === 'Stall Tactics') {
        message += requirements && requirements.actionCardName ?
            ` and discarded <ti-preview-link data-name="${requirements.actionCardName}" data-type="action-card"></ti-preview-link>.` :
            ' and discarded one action card.';
    }
    else if (ability === 'Orbital Drop') {
        message += ` to place 2 infantry on <ti-preview-link class="planet-link" data-name="${requirements.planetName}" data-type="planet-card"></ti-preview-link>.`;
    }
    else if (ability === 'Star Forge') {
        const systemNumber = requirements.systemNumber;
        const systemName = getSystemNameByNumber(systemNumber);
        message += requirements.unitName === 'Destroyer' ?
            ` to place 1 destroyer in the <span class="system-link" data-number="${systemNumber}">${systemName}</span>.` :
            ` to place 2 fighters in the <span class="system-link" data-number="${systemNumber}">${systemName}</span>.`;
    }
    else if (ability === 'Scavenge') {
        message += requirements.tradeGoods === 1 ?
            ` and gained 1 trade good.` :
            ` and gained ${requirements.tradeGoods} trade goods.`;
    }
    else if (ability === 'Peace Accords') {
        message += ` and gained control of <ti-preview-link class="planet-link" data-name="${requirements.planetName}" data-type="planet-card"></ti-preview-link>.`;
    }
    else if (ability === 'Quash') {
        message += ` and revealed <ti-preview-link data-name="${requirements.agendaName}" data-type="agenda-card"></ti-preview-link> as the new agenda.`;
    }
    else if (ability === 'Mitosis') {
        message += ` and placed 1 infantry on <ti-preview-link class="planet-link" data-name="${requirements.planetName}" data-type="planet-card"></ti-preview-link>.`;
    }
    else if (ability === 'Foresight') {
        const systemNumber = requirements.systemNumber;
        const systemName = getSystemNameByNumber(systemNumber);
        // Check for backwards compatibility before unit list was logged
        message += requirements.departedSystem ?
            ` and moved ${printSystemUnitList(requirements.departedSystem)}` :
            ` and moved their units`;
        message += ` to the <span class="system-link" data-number="${systemNumber}">${systemName}</span>.`;
    }
    else if (ability === 'Galactic Threat') {
        if (requirements.prediction) {
            let prediction = requirements.prediction;

            // If the prediction is a number, then it represents a player number for a player election
            if (!isNaN(requirements.prediction)) {
                const player = getPlayerByNumber(requirements.prediction);
                prediction = createPlayerTag(player.user._id);
            }

            message += ` and predicted the outcome: ${prediction}.`;
        }
        else {
            message += requirements.lostTechnologyName ?
                ` and lost the <ti-preview-link data-name="${requirements.lostTechnologyName}" data-type="technology-card"></ti-preview-link> technology to gain the <ti-preview-link data-name="${requirements.technologyName}" data-type="technology-card"></ti-preview-link> technology.` :
                ` and gained the <ti-preview-link data-name="${requirements.technologyName}" data-type="technology-card"></ti-preview-link> technology.`;
        }
    }
    else if (ability === 'Technological Singularity') {
        message += requirements.lostTechnologyName ?
            ` and lost the <ti-preview-link data-name="${requirements.lostTechnologyName}" data-type="technology-card"></ti-preview-link> technology to gain the <ti-preview-link data-name="${requirements.technologyName}" data-type="technology-card"></ti-preview-link> technology.` :
            ` and gained the <ti-preview-link data-name="${requirements.technologyName}" data-type="technology-card"></ti-preview-link> technology.`;
    }
    else if (ability === 'Ambush') {
        message += requirements.hitsProduced === 1 ? ' and produced 1 hit.' : ` and produced ${requirements.hitsProduced} hits.`;
    }
    else if (ability === 'Pillage') {
        const player = getPlayerByNumber(requirements.playerNumber);

        if (requirements.pass) {
            message = `${createPlayerTag(userId)} chose not to use the Pillage faction ability to take a trade good or commodity from ${createPlayerTag(player.user._id)}.`;
        }
        else {
            message += requirements.takeTradeGood ?
                ` and took 1 trade good from ${createPlayerTag(player.user._id)}.` :
                ` and took 1 commodity from ${createPlayerTag(player.user._id)}.`;
        }
    }
    else if (ability === 'Indoctrination') {
        const unitName = requirements.useMech ? UnitName.Mech : UnitName.Infantry;
        message += ` and replaced 1 of their opponent's infantry with 1 ${unitName.toLowerCase()} from their reinforcements.`;
    }
    else if (ability === 'Devotion') {
        message += ` and destroyed 1 ${requirements.destroyedShipName.toLowerCase()}`;

        if (requirements.opponentShip.name === UnitName.Infantry) {
            message += requirements.planetId ?
                ` to assign 1 hit to an infantry on <ti-preview-link class="planet-link" data-name="${getPlanetName(requirements.planetId)}" data-type="planet-card"></ti-preview-link>.` :
                ` to assign 1 hit to an infantry in the space area.`;
        }
        else if (requirements.opponentShip.name === UnitName.Mech) {
            const damagedState = requirements.opponentShip.sustainDamage.used ? 'a damaged' : 'an undamaged';
            message += requirements.planetId ?
                ` to assign 1 hit to ${damagedState} mech on <ti-preview-link class="planet-link" data-name="${getPlanetName(requirements.planetId)}" data-type="planet-card"></ti-preview-link>.` :
                ` to assign 1 hit to ${damagedState} mech in the space area.`;
        }
        else if (requirements.opponentShip.sustainDamage) {
            message += requirements.opponentShip.sustainDamage.used ?
                ` to assign 1 hit to a damaged ${requirements.opponentShip.name.toLowerCase()}.` :
                ` to assign 1 hit to an undamaged ${requirements.opponentShip.name.toLowerCase()}.`;
        }
        else {
            message += ` to assign 1 hit to a ${requirements.opponentShip.name.toLowerCase()}.`;
        }
    }
    else if (ability === 'Reclamation') {
        if (requirements) {
            if (requirements.placedSpaceDock && requirements.placedPDS) {
                message += ` and placed 1 space dock and 1 PDS on <ti-preview-link class="planet-link" data-name="${Planet.MecatolRex}" data-type="planet-card"></ti-preview-link>`;
            }
            else if (requirements.placedSpaceDock) {
                message += ` and placed 1 space dock on <ti-preview-link class="planet-link" data-name="${Planet.MecatolRex}" data-type="planet-card"></ti-preview-link>`;
            }
            else {
                message += ` and placed 1 PDS on <ti-preview-link class="planet-link" data-name="${Planet.MecatolRex}" data-type="planet-card"></ti-preview-link>`;
            }

            if (requirements.scuttledSpaceDockPlanetName && requirements.scuttledPDSPlanetName) {
                message += ` by removing 1 space dock from <ti-preview-link class="planet-link" data-name="${requirements.scuttledSpaceDockPlanetName}" data-type="planet-card"></ti-preview-link> and 1 PDS from <ti-preview-link class="planet-link" data-name="${requirements.scuttledPDSPlanetName}" data-type="planet-card"></ti-preview-link>`;
            }
            else if (requirements.scuttledSpaceDockPlanetName) {
                message += ` by removing 1 space dock from <ti-preview-link class="planet-link" data-name="${requirements.scuttledSpaceDockPlanetName}" data-type="planet-card"></ti-preview-link>`;
            }
            else if (requirements.scuttledPDSPlanetName) {
                message += ` by removing 1 PDS from <ti-preview-link class="planet-link" data-name="${requirements.scuttledPDSPlanetName}" data-type="planet-card"></ti-preview-link>`;
            }
        }

        message += '.';
    }
    else {
        message += '.';
    }

    return message;
}

function constructFlagshipAbilityLog(userId, flagship, requirements) {
    let message = `${createPlayerTag(userId)} used the ${flagship} flagship ability`;

    if (flagship === 'Genesis') {
        const systemNumber = requirements.systemNumber;
        const systemName = getSystemNameByNumber(systemNumber);
        message += ` to place 1 infantry in the space area of the <span class="system-link" data-number="${systemNumber}">${systemName}</span>.`;
    }
    else if (flagship === 'The Inferno') {
        const systemNumber = requirements.systemNumber;
        const systemName = getSystemNameByNumber(systemNumber);
        message += ` to place 1 cruiser in the <span class="system-link" data-number="${systemNumber}">${systemName}</span>.`;
    }
    else if (flagship === 'Arc Secundus') {
        message += ' to repair their flagship.';
    }
    else if (flagship === 'Wrath of Kenara') {
        message += requirements.tradeGoods === 1 ?
            ` and spent 1 trade good to apply +1 to the result of 1 dice.` :
            ` and spent ${requirements.tradeGoods} trade goods to apply +1 to the result of ${requirements.tradeGoods} dice.`;
    }
    else if (flagship === 'Duha Menaimon') {
        message += ` and produced ${printUnitList(requirements.units)}.`;
    }
    else if (flagship === 'The Alastor') {
        message += ' and chose';

        requirements.unitLocations.forEach((unitLocation, index) => {
            if (index > 0 && index === requirements.unitLocations.length - 1) {
                message += ' and';
            }

            if (unitLocation.planetName) {
                message += unitLocation.units ?
                    ` ${printUnitList(unitLocation.units)} from <ti-preview-link class="planet-link" data-name="${unitLocation.planetName}" data-type="planet-card"></ti-preview-link>` :
                    ` ${unitLocation.number} infantry from <ti-preview-link class="planet-link" data-name="${unitLocation.planetName}" data-type="planet-card"></ti-preview-link>`;
            }
            else {
                message += unitLocation.units ?
                    ` ${printUnitList(unitLocation.units)} from the space area` :
                    ` ${unitLocation.number} infantry from the space area`;
            }

            if (index !== requirements.unitLocations.length - 1 && requirements.unitLocations.length > 2) {
                message += ',';
            }
        });

        message += ` to participate in combat as if they were ships.`;
    }
    else if (flagship === 'Van Hauge') {
        message += ' to destroy all ships in this system.';
    }
    else if (flagship === 'Dynamo') {
        message += ` and spent 2 influence to repair the ${requirements.unitName}.`;
    }
    else {
        message += '.';
    }

    return message;
}

function constructFleetReducedLog(userId, removedSystems) {
    // For backwards compatibility before the units removed were logged
    if (!removedSystems) {
        return `${createPlayerTag(userId)} removed units from the board to meet their fleet/capacity constraints.`;
    }

    let message = `${createPlayerTag(userId)} removed`;

    removedSystems.forEach((removedSystem, index) => {
        if (index > 0 && index === removedSystems.length - 1) {
            message += ' and';
        }

        const systemNumber = removedSystem.number;
        const systemName = getSystemNameByNumber(systemNumber);
        message += ` ${printUnitList(removedSystem.units)} from the <span class="system-link" data-number="${systemNumber}">${systemName}</span>`;

        if (index !== removedSystems.length - 1 && removedSystems.length > 2) {
            message += ',';
        }
    });

    message += ' to meet their fleet/capacity constraints.';

    return message;
}

function constructTokenRemovedFromPoolLog(userId, chosenPool) {
    let message = `${createPlayerTag(userId)} removed a command token from their`;

    if (chosenPool === 'tacticPool') {
        message += ' tactic pool.';
    }
    else if (chosenPool === 'fleetPool') {
        message += ' fleet pool.';
    }
    else {
        message += ' strategy pool.';
    }

    return message;
}

function constructVoteLog(userId, agenda, abstain, outcome, votes) {
    if (abstain) {
        return `${createPlayerTag(userId)} abstained.`;
    }

    // "For" or "Against" agenda
    if (!agenda.isElection) {
        return votes === 1 ?
            `${createPlayerTag(userId)} cast 1 vote "${outcome}".` :
            `${createPlayerTag(userId)} cast ${votes} votes "${outcome}".`;
    }

    outcome = formatAgendaOutcome(agenda, outcome);

    return votes === 1 ?
        `${createPlayerTag(userId)} cast 1 vote to elect ${outcome}.` :
        `${createPlayerTag(userId)} cast ${votes} votes to elect ${outcome}.`;
}

function constructAgendaResolvedLog(agenda, outcome, tieBreak) {
    outcome = formatAgendaOutcome(agenda, outcome);

    return tieBreak ?
        `Speaker broke the tie for <ti-preview-link data-name="${agenda.name}" data-type="agenda-card"></ti-preview-link> and chose the outcome: ${outcome}.` :
        `<ti-preview-link data-name="${agenda.name}" data-type="agenda-card"></ti-preview-link> resolved with the outcome: ${outcome}.`;
}

function formatAgendaOutcome(agenda, outcome) {
    if (agenda.electionType === 'Player') {
        const player = getPlayerByNumber(outcome);
        outcome = createPlayerTag(player.user._id);
    }
    else if (agenda.electionType === 'Planet') {
        outcome = `<ti-preview-link class="planet-link" data-name="${outcome}" data-type="planet-card"></ti-preview-link>`;
    }
    else if (agenda.electionType === 'Law') {
        outcome = `<ti-preview-link data-name="${outcome}" data-type="agenda-card"></ti-preview-link>`;
    }
    else if (agenda.electionType === 'Scored Secret Objective') {
        outcome = `<ti-preview-link data-name="${outcome}" data-type="objective-card"></ti-preview-link>`;
    }

    return outcome;
}

function constructActionCardsDiscardedLog(userId, details) {
    let message = `${createPlayerTag(userId)} discarded`;

    details.actionCardNames.forEach((actionCardName, index) => {
        if (index > 0 && index === details.actionCardNames.length - 1) {
            message += ' and';
        }

        message += ` <ti-preview-link data-name="${actionCardName}" data-type="action-card"></ti-preview-link>`;

        if (index === details.actionCardNames.length - 1) {
            message += '.';
        }
        else if (details.actionCardNames.length > 2) {
            message += ',';
        }
    });

    return message;
}

function constructCommandTokensRedistributedLog(userId, details) {
    if (!details) {
        return `${createPlayerTag(userId)} redistributed their command tokens.`;
    }

    let message = `${createPlayerTag(userId)} gained ${details.tokensToGain} command tokens and redistributed their tokens to place `;

    message += details.tactic === 1 ? '1 token in their tactic pool, ' : `${details.tactic} tokens in their tactic pool, `;
    message += details.fleet === 1 ? '1 token in their fleet pool, ' : `${details.fleet} tokens in their fleet pool, `;
    message += details.strategy === 1 ? 'and 1 token in their strategy pool.' : `and ${details.strategy} tokens in their strategy pool.`;

    return message;
}

function constructLeadershipRiderResolvedLog(userId, details) {
    let message = `${createPlayerTag(userId)} resolved the <ti-preview-link data-name="${ActionCard.LeadershipRider}" data-type="action-card"></ti-preview-link> action card to gain `;

    message += details.tactic === 1 ? '1 tactic token, ' : `${details.tactic} tactic tokens, `;
    message += details.fleet === 1 ? '1 fleet token, ' : `${details.fleet} fleet tokens, `;
    message += details.strategy === 1 ? 'and 1 strategy token.' : `and ${details.strategy} strategy tokens.`;

    return message;
}

function constructDiplomacyRiderResolvedLog(userId, details) {
    const systemName = getSystemNameByNumber(details.systemNumber);
    return `${createPlayerTag(userId)} resolved the <ti-preview-link data-name="${ActionCard.DiplomacyRider}" data-type="action-card"></ti-preview-link> action card and chose the <span class="system-link" data-number="${details.systemNumber}">${systemName}</span>.`;
}

function constructPoliticsRiderResolvedLog(userId) {
    return `${createPlayerTag(userId)} resolved the <ti-preview-link data-name="${ActionCard.PoliticsRider}" data-type="action-card"></ti-preview-link> action card to draw 3 action cards and gain the speaker token.`;
}

function constructConstructionRiderResolvedLog(userId, details) {
    let message = `${createPlayerTag(userId)} resolved the <ti-preview-link data-name="${ActionCard.ConstructionRider}" data-type="action-card"></ti-preview-link> action card`;

    if (!details.planetName) {
        message += ' but chose not to scuttle 1 space dock in order to place 1 space dock.';
        return message;
    }

    message += ` and placed 1 space dock on <ti-preview-link class="planet-link" data-name="${details.planetName}" data-type="planet-card"></ti-preview-link>`;

    if (details.scuttlePlanetName) {
        message += ` by scuttling 1 space dock on <ti-preview-link class="planet-link" data-name="${details.scuttlePlanetName}" data-type="planet-card"></ti-preview-link>`;
    }
    else if (details.scuttleSystemNumber) {
        const scuttleSystemName = getSystemNameByNumber(details.scuttleSystemNumber);
        message += ` by scuttling 1 space dock in the <span class="system-link" data-number="${details.scuttleSystemNumber}">${scuttleSystemName}</span>`;
    }

    message += '.';
    return message;
}

function constructTradeRiderResolvedLog(userId) {
    return `${createPlayerTag(userId)} resolved the <ti-preview-link data-name="${ActionCard.TradeRider}" data-type="action-card"></ti-preview-link> action card to gain 5 trade goods.`;
}

function constructWarfareRiderResolvedLog(userId, details) {
    let message = `${createPlayerTag(userId)} resolved the <ti-preview-link data-name="${ActionCard.WarfareRider}" data-type="action-card"></ti-preview-link> action card`;

    if (!details.systemNumber) {
        message += ' but chose not to scuttle 1 dreadnought in order to place 1 dreadnought.';
        return message;
    }

    const systemName = getSystemNameByNumber(details.systemNumber);
    message += ` and placed 1 dreadnought in the <span class="system-link" data-number="${details.systemNumber}">${systemName}</span>`;

    if (details.scuttleSystemNumber) {
        const scuttleSystemName = getSystemNameByNumber(details.scuttleSystemNumber);
        message += ` by scuttling 1 dreadnought in the <span class="system-link" data-number="${details.scuttleSystemNumber}">${scuttleSystemName}</span>`;
    }

    message += '.';
    return message;
}

function constructImperialRiderResolvedLog(userId) {
    return `${createPlayerTag(userId)} resolved the <ti-preview-link data-name="${ActionCard.ImperialRider}" data-type="action-card"></ti-preview-link> action card to gain 1 victory point.`;
}

function constructDiplomaticPressureResolvedLog(userId, details) {
    let message = `${createPlayerTag(userId)} resolved the <ti-preview-link data-name="${ActionCard.DiplomaticPressure}" data-type="action-card"></ti-preview-link> action card and gave`;

    message += details.revealedPromissoryNoteName ? ` <ti-preview-link data-name="${details.revealedPromissoryNoteName}" data-type="promissory-note" data-color="${details.revealedPromissoryNoteColor}"></ti-preview-link>` : ' 1 promissory note';

    const receivingPlayer = getPlayerByNumber(details.receivingPlayerNumber);
    message += ` to ${createPlayerTag(receivingPlayer.user._id)}.`;

    return message;
}

function constructResearchGrantReallocationResolvedLog(userId, details) {
    let message = `${createPlayerTag(userId)} resolved the <ti-preview-link data-name="Research Grant Reallocation" data-type="agenda-card"></ti-preview-link> agenda card and`;

    if (details.tokensToRemove === 0) {
        message += ' gained';
    }
    else if (details.tokensToRemove === 1) {
        message += ' removed 1 token from their fleet pool to gain';
    }
    else {
        message += ` removed ${details.tokensToRemove} tokens from their fleet pool to gain`;
    }

    message += ` the <ti-preview-link data-name="${details.technologyName}" data-type="technology-card"></ti-preview-link> technology card.`;

    return message;
}

function constructExplorationCardResolvedLog(userId, type, name, requirements) {
    let message = `${createPlayerTag(userId)} resolved the <ti-preview-link data-name="${name}" data-type="exploration" data-exploration-type="${type}"></ti-preview-link> exploration card`;

    if (name === ExplorationCard.AbandonedWarehouses) {
        if (requirements.pass) {
            message += ' but chose not to use its abilities.';
        }
        else if (isNaN(requirements.commoditiesConverted)) {
            message += ' and chose to gain 2 commodities.';
        }
        else {
            const subMessage = requirements.commoditiesConverted === 1 ? '1 commodity to 1 trade good' : `${requirements.commoditiesConverted} commodities to trade goods`;
            message += ` and chose to convert ${subMessage}.`;
        }
    }
    else if (name === ExplorationCard.CoreMine) {
        message += requirements.removeInfantry ?
            ` and chose to remove 1 infantry from <ti-preview-link class="planet-link" data-name="${requirements.planetName}" data-type="planet-card"></ti-preview-link> to gain 1 trade good.` :
            ` and chose not to remove 1 infantry from <ti-preview-link class="planet-link" data-name="${requirements.planetName}" data-type="planet-card"></ti-preview-link> to gain 1 trade good.`;
    }
    else if (name === ExplorationCard.EntropicField) {
        message += ` and gained ${printCommandTokenList(requirements)} and 2 trade goods.`;
    }
    else if (name === ExplorationCard.Expedition) {
        message += requirements.removeInfantry ?
            ` and chose to remove 1 infantry from <ti-preview-link class="planet-link" data-name="${requirements.planetName}" data-type="planet-card"></ti-preview-link> to ready it.` :
            ` and chose not to remove 1 infantry from <ti-preview-link class="planet-link" data-name="${requirements.planetName}" data-type="planet-card"></ti-preview-link> to ready it.`;
    }
    else if (name === ExplorationCard.FunctioningBase) {
        if (requirements.pass) {
            message += ' but chose not to use its abilities.';
        }
        else if (requirements.spendTradeGood) {
            message += ' and chose to spend 1 trade good to draw 1 action card.';
        }
        else if (requirements.spendCommodity) {
            message += ' and chose to spend 1 commodity to draw 1 action card.';
        }
        else {
            message += ' and chose to gain 1 commodity.';
        }
    }
    else if (name === ExplorationCard.KeleresShip) {
        message += ` and gained ${printCommandTokenList(requirements)}.`;
    }
    else if (name === ExplorationCard.LocalFabricators) {
        if (requirements.pass) {
            message += ' but chose not to use its abilities.';
        }
        else if (requirements.spendTradeGood || requirements.spendCommodity) {
            const cost = requirements.spendTradeGood ? '1 trade good' : '1 commodity';
            message += ` and chose to spend ${cost} and ${printUnitPlacementMessage(UnitName.Mech, null, requirements.planetName, requirements.scuttledSystemNumber, requirements.scuttledPlanetName)}.`;
        }
        else {
            message += ' and chose to gain 1 commodity.';
        }
    }
    else if (name === ExplorationCard.MajorEntropicField) {
        message += ` and gained ${printCommandTokenList(requirements)} and 3 trade goods.`;
    }
    else if (name === ExplorationCard.MercenaryOutfit) {
        message += requirements.placeInfantry ?
            ` and chose to place 1 infantry on <ti-preview-link class="planet-link" data-name="${requirements.planetName}" data-type="planet-card"></ti-preview-link>.` :
            ` and chose not to place 1 infantry on <ti-preview-link class="planet-link" data-name="${requirements.planetName}" data-type="planet-card"></ti-preview-link>.`;
    }
    else if (name === ExplorationCard.MerchantStation) {
        message += requirements.replenish ? ' and chose to replenish their commodities.' : ' and chose to convert their commodities to trade goods.';
    }
    else if (name === ExplorationCard.MinorEntropicField) {
        message += ` and gained ${printCommandTokenList(requirements)} and 1 trade good.`;
    }
    else if (name === ExplorationCard.VolatileFuelSource) {
        if (requirements.hasMech) {
            message += ` and gained ${printCommandTokenList(requirements)}.`;
        }
        else {
            message += requirements.removeInfantry ?
                ` and chose to remove 1 infantry from <ti-preview-link class="planet-link" data-name="${requirements.planetName}" data-type="planet-card"></ti-preview-link> to gain ${printCommandTokenList(requirements)}.` :
                ` and chose not to remove 1 infantry from <ti-preview-link class="planet-link" data-name="${requirements.planetName}" data-type="planet-card"></ti-preview-link> to gain 1 command token.`;
        }
    }
    else {
        message += '.';
    }

    return message;
}

function constructSustainDamageLog(userId, details) {
    let message = `${createPlayerTag(userId)} used the Sustain Damage ability of their ${details.unitName}`;

    if (details.planetName) {
        message += ` on <ti-preview-link class="planet-link" data-name="${details.planetName}" data-type="planet-card"></ti-preview-link>`;
    }

    message += '.';

    return message;
}

function constructMechAbilityUsedLog(userId, details) {
    const faction = details.faction;
    let message = `${createPlayerTag(userId)} used their <ti-preview-link data-name="${UnitName.Mech}" data-faction="${faction}" data-type="unit-card"></ti-preview-link> ability`;

    if (faction === Faction.Arborec) {
        if (details.requirements.planetName) {
            message += ` to replace 1 of their infantry on <ti-preview-link class="planet-link" data-name="${details.requirements.planetName}" data-type="planet-card"></ti-preview-link> with 1 mech from their reinforcements.`;
        }
        else {
            const systemNumber = details.requirements.systemNumber;
            const systemName = getSystemNameByNumber(systemNumber);
            message += ` to replace 1 of their infantry in the space area of the <span class="system-link" data-number="${systemNumber}">${systemName}</span> with 1 mech from their reinforcements.`;
        }
    }
    else if (faction === Faction.BaronyOfLetnev) {
        message += ' to replace 1 of their infantry in the combat with 1 mech.';
    }
    else if (faction === Faction.ClanOfSaar) {
        message += ` to deploy a mech on <ti-preview-link class="planet-link" data-name="${details.requirements.planetName}" data-type="planet-card"></ti-preview-link>.`;
    }
    else if (faction === Faction.EmbersOfMuaat) {
        message += ' to place';

        details.placements.forEach((placement, index) => {
            if (index > 0 && index === details.placements.length - 1) {
                message += ' and';
            }

            if (placement.planetName) {
                message += ` ${placement.infantry} infantry on <ti-preview-link class="planet-link" data-name="${placement.planetName}" data-type="planet-card"></ti-preview-link>`;
            }
            else {
                const systemName = getSystemNameByNumber(placement.systemNumber);
                message += ` ${placement.infantry} infantry in the space area of the <span class="system-link" data-number="${placement.systemNumber}">${systemName}</span>`;
            }

            if (index !== details.placements.length - 1 && details.placements.length > 2) {
                message += ',';
            }
        });

        message += '.';
    }
    else if (faction === Faction.EmiratesOfHacan) {
        const player = getPlayerByNumber(details.playerNumber);
        message += ` to trade <ti-preview-link class="planet-link" data-name="${details.planetName}" data-type="planet-card"></ti-preview-link> to ${createPlayerTag(player.user._id)} and moved their units on that planet to <ti-preview-link class="planet-link" data-name="${details.requirements.planetName}" data-type="planet-card"></ti-preview-link>.`;
    }
    else if (faction === Faction.Empyrean) {
        message += ` to cancel the <ti-preview-link data-name="${details.actionCardName}" data-type="action-card"></ti-preview-link> action card by removing their mech`;

        if (details.planetName) {
            message += ` on <ti-preview-link class="planet-link" data-name="${details.planetName}" data-type="planet-card"></ti-preview-link>.`;
        }
        else {
            const systemNumber = details.systemNumber;
            const systemName = getSystemNameByNumber(systemNumber);
            message += ` from the space area of the <span class="system-link" data-number="${systemNumber}">${systemName}</span>.`;
        }
    }
    else if (faction === Faction.FederationOfSol) {
        message += ` to deploy a mech on <ti-preview-link class="planet-link" data-name="${details.planetName}" data-type="planet-card"></ti-preview-link>.`;
    }
    else if (faction === Faction.GhostsOfCreuss) {
        const systemNumber = details.requirements.systemNumber;
        const systemName = getSystemNameByNumber(systemNumber);
        const wormholeType = details.requirements.wormholeType.toLowerCase();

        message += details.requirements.moved ?
            ` and moved the ${wormholeType} wormhole token to the <span class="system-link" data-number="${systemNumber}">${systemName}</span>.` :
            ` and placed the ${wormholeType} wormhole token in the <span class="system-link" data-number="${systemNumber}">${systemName}</span>.`;
    }
    else if (faction === Faction.SardakkNorr) {
        message += ' to produce 1 additional hit against their opponent.';
    }
    else if (faction === Faction.Winnu) {
        let unitName = details.requirements.unitName;

        if (unitName === UnitName.SpaceDock) {
            unitName = unitName.toLowerCase();
        }

        message += ` to place 1 ${unitName} on <ti-preview-link class="planet-link" data-name="${details.requirements.planetName}" data-type="planet-card"></ti-preview-link>`;

        if (details.requirements.scuttledPlanetName) {
            message += ` by removing 1 ${unitName} from <ti-preview-link class="planet-link" data-name="${details.requirements.scuttledPlanetName}" data-type="planet-card"></ti-preview-link>`;
        }

        message += '.';
    }
    else if (faction === Faction.YssarilTribes) {
        message += ` to deploy a mech on <ti-preview-link class="planet-link" data-name="${details.requirements.planetName}" data-type="planet-card"></ti-preview-link>.`;
    }
    else {
        message += '.';
    }

    return message;
}

function constructLegendaryPlanetCardPlayedLog(userId, details) {
    let message = `${createPlayerTag(userId)} played <ti-preview-link data-name="${details.name}" data-type="legendary-planet-card"></ti-preview-link>`;

    if (details.name === LegendaryPlanet.TheAtrament) {
        message += ` and placed ${details.requirements.numberOfInfantry} infantry on <ti-preview-link class="planet-link" data-name="${details.requirements.planetName}" data-type="planet-card"></ti-preview-link>.`;
    }
    else if (details.name === LegendaryPlanet.ImperialArmsVault) {
        if (details.actionCardsDrawn) {
            message += details.actionCardsDrawn === 1 ? ' and drew 1 action card.' : ` and drew ${details.actionCardsDrawn} action cards.`;
        }
        else {
            message += ` and ${printUnitPlacementMessage(UnitName.Mech, null, details.requirements.planetName, details.requirements.scuttledSystemNumber, details.requirements.scuttledPlanetName)}.`;
        }
    }
    else {
        message += '.';
    }

    return message;
}

function constructRelicFragmentsPlayedLog(userId, type, relicFragments, unknownRelicFragments, relic) {
    let message = `${createPlayerTag(userId)} purged`;
    const name = getRelicFragmentNameByType(type);

    message += relicFragments === 1 ?
        ` 1 <ti-preview-link data-name="${name}" data-type="exploration" data-exploration-type="${type}"></ti-preview-link> card` :
        ` ${relicFragments} <ti-preview-link data-name="${name}" data-type="exploration" data-exploration-type="${type}"></ti-preview-link> cards`;

    if (unknownRelicFragments > 0) {
        message += unknownRelicFragments === 1 ?
            ` and 1 <ti-preview-link data-name="${ExplorationCard.UnknownRelicFragment}" data-type="exploration" data-exploration-type="${ExplorationType.Frontier}"></ti-preview-link> card` :
            ` and ${unknownRelicFragments} <ti-preview-link data-name="${ExplorationCard.UnknownRelicFragment}" data-type="exploration" data-exploration-type="${ExplorationType.Frontier}"></ti-preview-link> cards`;
    }

    message += relic ?
        ` and gained the <ti-preview-link data-name="${relic.name}" data-type="relic"></ti-preview-link> relic.` :
        ' but did not gain a relic because there were none left in the deck.';

    return message;
}

function constructRelicPlayedLog(userId, name, requirements) {
    let message = `${createPlayerTag(userId)} played the <ti-preview-link data-name="${name}" data-type="relic"></ti-preview-link> relic card`;

    if (name === RelicName.DynamisCore) {
        message += ` and gained ${requirements.tradeGoodsGained} trade goods.`;
    }
    else if (name === RelicName.JRXS4550) {
        const chosenPlayer = getPlayerByNumber(requirements.playerNumber);
        message += ` and chose ${createPlayerTag(chosenPlayer.user._id)} to use its ability.`;
    }
    else if (name === RelicName.NanoForge) {
        message += ` and attached it to <ti-preview-link class="planet-link" data-name="${requirements.planetName}" data-type="planet-card"></ti-preview-link>.`;
    }
    else if (name === RelicName.TheCodex) {
        if (requirements.actionCardNames.length === 0) {
            message += ' but did not take any action cards from the discard pile.';
        }
        else {
            message += ' and took';

            requirements.actionCardNames.forEach((actionCardName, index) => {
                if (index > 0 && index === requirements.actionCardNames.length - 1) {
                    message += ' and';
                }

                message += ` <ti-preview-link data-name="${actionCardName}" data-type="action-card"></ti-preview-link>`;

                if (index !== requirements.actionCardNames.length - 1 && requirements.actionCardNames.length > 2) {
                    message += ',';
                }
            });

            message += ' from the action card discard pile.';
        }
    }
    else if (name === RelicName.TheCrownOfEmphidia) {
        if (requirements && requirements.planetName) {
            message += ` and explored <ti-preview-link class="planet-link" data-name="${requirements.planetName}" data-type="planet-card"></ti-preview-link>.`;
        }
        else {
            message += ' and purged it to gain 1 victory point.';
        }
    }
    else {
        message += '.';
    }

    return message;
}

function constructJRXS4550ResolvedLog(userId, details) {
    let message = `${createPlayerTag(userId)} resolved the <ti-preview-link data-name="${RelicName.JRXS4550}" data-type="relic"></ti-preview-link> relic card`;

    message += details.placedStructure ?
        ` and ${printUnitPlacementMessage(details.requirements.unitName, null, details.requirements.planetName, details.requirements.scuttledSystemNumber, details.requirements.scuttledPlanetName)}.` :
        ' and chose to gain 1 trade good.';

    return message;
}

export { writeGameLog, initializeGameLogs }
```

I'm playing twilight imperium with my friends online via https://www.twilightwars.com/. We are interested in exporting our game log as a text file at the end of the match. I found the .js file for making the game log, based on that, do you have an idea how I could find the game log? I am using Google Chrome.

## Assistant:

> 9/17/2026 12:34:24

> Weighing DOM scraping against fetching the raw API directly.
>
> - Weighing DOM scraping against fetching the raw API directly.
> - **Done**

Good news: the file tells you most of what you need. Two things stand out.

**The logs come from an API call, not the page source.** `getGameLogs(lastLogId)` in `api.js` fetches them, and `initializeGameLogs` only pulls 25 at a time, prepending older batches when you scroll within 100px of the top (`logs.length < 25` is how it decides it hit the beginning). So whichever route you take, you have to exhaust that pagination.

**Route 1: grab the JSON straight from the endpoint.** Open the game, press F12, go to the Network tab, filter to Fetch/XHR, then open the log panel and scroll it upward. You should see the request fire. Right-click it and "Copy as fetch" to get the exact URL, headers, and cookies. Then in the Console you can loop it yourself, passing the oldest log's `_id` as `lastLogId` each time, until a batch comes back with fewer than 25 entries. This gives you the raw event objects, which are complete but not sentences.

**Route 2: let the site render the text, then scrape it.** Usually nicer for a human-readable log. In the Console on the game page:

```js
const el = document.getElementById('game-logs');
el.scrollTop = 0;
let n = -1;
while (el.querySelectorAll('.game-log').length !== n) {
  n = el.querySelectorAll('.game-log').length;
  el.scrollTop = 0;
  await el.onscroll();          // the loader is bound here
  await new Promise(r => setTimeout(r, 400));
}

const text = [...el.querySelectorAll('.game-log')].map(node => {
  const time = node.querySelector('.timestamp')?.title ?? '';
  const msg = node.querySelector('.message').cloneNode(true);
  // card links carry their name in an attribute, not as text
  msg.querySelectorAll('ti-preview-link').forEach(link =>
    link.replaceWith(document.createTextNode(link.dataset.name ?? '')));
  return `[${time}] ${msg.innerText.replace(/\s+/g, ' ').trim()}`;
}).join('\n');

const a = document.createElement('a');
a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
a.download = 'ti-game-log.txt';
a.click();
```

The `ti-preview-link` replacement matters. Those custom elements hold the card name in a `data-name` attribute and probably fill their own text via shadow DOM, so a plain `innerText` grab would give you "Tyler played the action card" with the card name missing.

One thing to watch: `writeGameLog` throws on unrecognized events and the catch writes an "Error loading game log" bubble instead, so if a few lines come out as errors, that is the site's renderer, not your script.

Before I refine either version, which output do you actually want in the text file? Readable sentences like the panel shows, or the raw JSON events so you can crunch stats on them later?

## User:

> 9/17/2026 12:38:40

I tested out Round 2, and it worked except it didn't show WHO had done what, just what was done at what times. Could I get two console commands, one for a .txt and one for a .json export?

## Assistant:

> 9/17/2026 12:39:10

> Designing a generic fallback for empty player-tag text.
>
> - Designing a generic fallback for empty player-tag text.
> - **Done**

Two self-contained commands below. The fix for the missing names is the same in both: player tags are almost certainly custom elements like the card links, so text has to be pulled from the shadow root or the attributes rather than `innerText`.

**1. Text export**

```js
(async () => {
  const el = document.getElementById('game-logs');
  el.scrollTop = 0;
  let n = -1;
  while (el.querySelectorAll('.game-log').length !== n) {
    n = el.querySelectorAll('.game-log').length;
    el.scrollTop = 0;
    if (el.onscroll) await el.onscroll();
    await new Promise(r => setTimeout(r, 400));
  }

  const label = (node) => {
    const live = document.querySelector(`#${node.id} `) ;
    return null;
  };

  const flatten = (source) => {
    const clone = source.cloneNode(true);
    // custom elements (card links, player tags) hide their text; rebuild it
    clone.querySelectorAll('*').forEach(sub => {
      if (!sub.tagName.includes('-')) return;
      const orig = [...source.querySelectorAll(sub.tagName)]
        .find(o => o.outerHTML === sub.outerHTML);
      let text = (orig?.shadowRoot?.textContent || orig?.innerText || '').trim();
      if (!text) text = sub.dataset.name || sub.dataset.number || sub.dataset.id || '';
      sub.replaceWith(document.createTextNode(text));
    });
    return clone.innerText.replace(/\s+/g, ' ').trim();
  };

  const lines = [...el.querySelectorAll('.game-log')].map(node => {
    const time = node.querySelector('.timestamp')?.title ?? '';
    return `[${time}] ${flatten(node.querySelector('.message'))}`;
  });

  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/plain' }));
  a.download = 'ti-game-log.txt';
  a.click();
  console.log(`${lines.length} entries exported`);
})();
```

**2. JSON export**

```js
(async () => {
  const el = document.getElementById('game-logs');
  el.scrollTop = 0;
  let n = -1;
  while (el.querySelectorAll('.game-log').length !== n) {
    n = el.querySelectorAll('.game-log').length;
    el.scrollTop = 0;
    if (el.onscroll) await el.onscroll();
    await new Promise(r => setTimeout(r, 400));
  }

  const entries = [...el.querySelectorAll('.game-log')].map(node => {
    const msg = node.querySelector('.message');
    const refs = [...msg.querySelectorAll('*')]
      .filter(sub => sub.tagName.includes('-') || sub.classList.contains('system-link'))
      .map(sub => ({
        element: sub.tagName.toLowerCase(),
        text: (sub.shadowRoot?.textContent || sub.innerText || '').trim(),
        data: { ...sub.dataset }
      }));

    return {
      id: node.id,
      time: node.querySelector('.timestamp')?.title ?? null,
      icon: node.querySelector('.icon i')?.className ?? null,
      html: msg.innerHTML,
      references: refs
    };
  });

  const a = document.createElement('a');
  a.href = URL.createObjectURL(
    new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' }));
  a.download = 'ti-game-log.json';
  a.click();
  console.log(`${entries.length} entries exported`);
})();
```

The JSON one keeps the raw `innerHTML` plus a `references` array, so every player tag and card link is preserved with its attributes even if the visible text is empty. That way nothing is lost and you can post-process names later.

If the text file still comes out anonymous, run this one-liner and paste me what it prints. It shows exactly how a player tag is built, and I can hardcode the right lookup:

```js
console.log(document.querySelector('#game-logs .message').innerHTML);
```

One question so I aim the next pass correctly: do you want the names as display names, or would the Twilight Wars usernames be fine?

## User:

> 9/17/2026 12:50:35

The JSON one is awesome, thank you. Name is coming up fine now. For the text one, it's too much information for the human beings among us. I'm pasting an example line here:

[Friday, March 27, 2026 at 8:49 PM] :host { align-items: center; background-color: var(--background-color-secondary); border-radius: 9999px; box-shadow: 0 3px 3px -2px #0003, 0 3px 4px #00000024, 0 1px 8px #0000001f; display: inline-flex; gap: 3px; margin: 1px 0; padding: 3px 5px; vertical-align: middle; } .hidden { display: none !important; } gregholmes04 discarded one of their starting secret objectives.

Shorten it to:
[Friday, March 27, 2026 at 8:49 PM]  gregholmes04 discarded one of their starting secret objectives.

## Assistant:

> 9/17/2026 12:50:57

> Fixing text extraction from shadow DOM elements.
>
> - Fixing text extraction from shadow DOM elements.
> - **Done**

The culprit is `shadowRoot.textContent`, which scoops up the `<style>` block sitting inside the shadow root along with the username. Here's the corrected text export, with the flattening rewritten to walk nodes properly and skip style and script tags:

```js
(async () => {
  const el = document.getElementById('game-logs');
  el.scrollTop = 0;
  let n = -1;
  while (el.querySelectorAll('.game-log').length !== n) {
    n = el.querySelectorAll('.game-log').length;
    el.scrollTop = 0;
    if (el.onscroll) await el.onscroll();
    await new Promise(r => setTimeout(r, 400));
  }

  const SKIP = new Set(['STYLE', 'SCRIPT', 'TEMPLATE', 'LINK']);

  const textOf = (node) => {
    if (node.nodeType === Node.TEXT_NODE) return node.nodeValue;
    if (node.nodeType !== Node.ELEMENT_NODE) return '';
    if (SKIP.has(node.tagName)) return '';

    // a slot renders whatever light-DOM content was assigned to it
    if (node.tagName === 'SLOT') {
      return node.assignedNodes({ flatten: true }).map(textOf).join('');
    }

    // shadow root wins: its slots pull in the light DOM as needed
    const children = node.shadowRoot
      ? [...node.shadowRoot.childNodes]
      : [...node.childNodes];

    let out = children.map(textOf).join('');

    // fall back to attributes for elements that render no text
    if (!out.trim() && node.dataset) {
      out = node.dataset.name || node.dataset.number || '';
    }
    return out;
  };

  const lines = [...el.querySelectorAll('.game-log')].map(node => {
    const time = node.querySelector('.timestamp')?.title ?? '';
    const msg = textOf(node.querySelector('.message')).replace(/\s+/g, ' ').trim();
    return `[${time}] ${msg}`;
  });

  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/plain' }));
  a.download = 'ti-game-log.txt';
  a.click();
  console.log(`${lines.length} entries exported`);
})();
```

The slot handling is the other piece worth knowing about. If a tag's shadow root has a `<slot>`, the visible text lives in the light DOM and gets projected through it, so walking only one side would drop content. This version follows the slot to its assigned nodes and skips the light children otherwise, which prevents both dropped and doubled text.

One thing you might want next: the dice rolls and hit assignments produce a lot of lines, and a full six-player game will run to thousands of entries. Would a filtered version help, say one that drops the roll and hit-assignment events and keeps the narrative beats, or do you want everything in there?

## User:

> 9/17/2026 12:55:10

> File: ti-game-log.json

This is all great, so I've got an Observable 2.0 notebook open (make sure to be up and up on latest documentation as it's new). What are some fun graphs I could make with this data? Here is the JSON we created attached to this comment.

## Assistant:

> 9/17/2026 12:57:21

> Drafting a clear, code-heavy technical answer with a follow-up question.
>
> - Reviewing an uploaded JSON file for an Observable notebook task.
> - Check the file-reading skill before inspecting the uploaded JSON
> - Inspect structure of the exported game log JSON
> - Inspect JSON structure with python
> - Exploring the structure of player entries in the dataset.
> - Survey players, factions, event icon types, and date range
> - Analyzing game data and log entries in detail.
> - Survey reference element types, systems, and key event phrases
> - Exploring fun graph ideas for an Observable notebook.
> - Observable Notebooks 2.0 documentation
> - [https://observablehq.com/notebook-kit/system-guide (observablehq.com)](https://observablehq.com/notebook-kit/system-guide)
> - Narrowing the idea list and planning what to present.
> - Sample message formats for key event types
> - Reconstructing planet control history from raw event text.
> - Check whether roll/cost summary data made it into the export
> - Drafting a clear, code-heavy technical answer with a follow-up question.
> - **Done**

Your log has 1884 entries, six players, and spans March 26 to September 17, so you have roughly six months of asynchronous play to slice. That last part is what makes this dataset more interesting than a normal TI log.

**First, the shared parse cell.** Two gotchas worth knowing before you plot anything. The `time` strings won't go through `new Date()` because of the " at ", and when you parse `html` into a detached document the custom elements never upgrade, so `textContent` silently drops every player name. Both handled here:

```js
const MONTHS = "January February March April May June July August September October November December".split(" ");

function parseTime(s) {
  const [, mon, day, year, h, min, ap] =
    /(\w+) (\d+), (\d{4}) at (\d+):(\d+)\s*(AM|PM)/.exec(s);
  const hour = (+h % 12) + (ap === "PM" ? 12 : 0);
  return new Date(+year, MONTHS.indexOf(mon), +day, hour, +min);
}

const log = (await FileAttachment("ti-game-log.json").json()).map((entry, i) => {
  const doc = new DOMParser().parseFromString(entry.html, "text/html");

  const players = [...doc.querySelectorAll("ti-player-tag")].map((t) => ({
    name: t.getAttribute("name"),
    faction: t.getAttribute("faction"),
    color: t.getAttribute("color")
  }));
  const cards = [...doc.querySelectorAll("ti-preview-link")].map((l) => ({
    name: l.dataset.name,
    type: l.dataset.type
  }));
  const systems = [...doc.querySelectorAll(".system-link")].map((s) => +s.dataset.number);

  // rebuild readable text now that we've harvested the attributes
  for (const el of doc.querySelectorAll("ti-player-tag")) el.replaceWith(el.getAttribute("name"));
  for (const el of doc.querySelectorAll("ti-preview-link")) el.replaceWith(el.dataset.name ?? "");

  return {
    i,
    date: parseTime(entry.time),
    actor: players[0]?.name ?? null,
    players,
    cards,
    systems,
    text: doc.body.textContent.replace(/\s+/g, " ").trim()
  };
});

const colorScale = {
  domain: ["Yod25", "chris.maliga", "baconarray", "Beans", "gimbodo", "gregholmes04"],
  range: ["#e03b3b", "#e879b0", "#e88a2a", "#d6c02a", "#3fa84a", "#3b7de0"]
};

display(log.length);
```

The faction colors are in the export, so I mapped them to hex rather than using the CSS keywords; raw `yellow` is unreadable on a light background.

**Graph 1: the punchcard.** Six months of async play means your group has habits, and this exposes them cleanly.

```js
Plot.plot({
  width,
  height: 260,
  marginLeft: 80,
  x: {domain: d3.range(0, 24), label: "hour"},
  y: {domain: [1, 2, 3, 4, 5, 6, 0], tickFormat: (d) => "SunMonTueWedThuFriSat".slice(d * 3, d * 3 + 3)},
  color: {scheme: "YlGnBu", legend: true, label: "log entries"},
  marks: [
    Plot.cell(log, Plot.group({fill: "count"}, {
      x: (d) => d.date.getHours(),
      y: (d) => d.date.getDay(),
      inset: 0.5
    }))
  ]
})
```

**Graph 2: planet control over time.** This is the one I'd build first. Every conquest fires an "established control of" event naming the planet, so you can replay ownership forward and get a genuine map-control story arc rather than a static snapshot.

```js
const controlHistory = (() => {
  const owner = new Map();
  const frames = [];
  for (const d of log) {
    if (!/established control of/.test(d.text)) continue;
    for (const c of d.cards.filter((c) => c.type === "planet-card")) {
      owner.set(c.name, d.actor);
    }
    const counts = d3.rollup(owner, (v) => v.length, (v) => v);
    for (const p of colorScale.domain) {
      frames.push({date: d.date, player: p, planets: [...owner.values()].filter((o) => o === p).length});
    }
  }
  return frames;
})();

Plot.plot({
  width,
  height: 320,
  y: {grid: true, label: "planets controlled"},
  color: colorScale,
  marks: [
    Plot.areaY(controlHistory, {x: "date", y: "planets", fill: "player", curve: "step", tip: true}),
    Plot.ruleY([0])
  ]
})
```

One caveat: home planets are never "established", so this tracks conquest rather than total holdings. Add three to each player's baseline if you want true counts.

**Graph 3: think time, or the shame chart.** Take the gap between consecutive "ended their turn" events and attribute it to whoever ended the later one. You have 219 of those, plenty for a box plot per player. In a six-month async game this is the graph your friends will actually argue about.

**Graph 4: trade network.** 53 accepted trades, each with two player tags in the html, so `d.players[0]` and `d.players[1]` give you edges directly. A d3 chord diagram, or an arc diagram with edge width by volume, shows the Hacan player's web nicely.

**Graph 5: the VP race.** 33 objectives scored plus the custodians event, the Imperial rider, and Crown of Emphidia, drawn as a step line per player. Use the 8 "Public objective revealed" entries as `Plot.ruleX` annotations to mark round boundaries.

**Graph 6: contested systems.** 37 distinct systems get referenced. A player-by-system cell matrix of activations shows who lived where, and the columns with multiple colors are your war zones.

One thing to know before you attempt a dice-luck chart: the roll summaries are not in this export. The site attaches those via jQuery `.data()` on a sibling element outside `.message`, so we captured hit totals like "produced 3 hits" but never the individual die faces. Parsing hits from `text` still gives you hits-per-roll distributions, which is most of the fun. If you want true luck analysis against unit combat values, that needs the raw API route from the start of our conversation.

Which of these should I write out in full? The think-time box plot and the trade chord are the two that need real work beyond a single Plot call, so I'd start there unless you have a different favorite.

---

**Sources:**

- [Observable Notebooks 2.0 Technology Preview | Observable](https://observablehq.com/notebook-kit/)
- [observable-notebooks | Skills Marketplace · LobeHub](https://lobehub.com/skills/maragudk-skills-observable-notebooks)
- [notebook kit](https://npmjs.com/package/@observablehq/notebook-kit)
- [Previewing Observable Notebooks 2.0 | Observable](https://observablehq.com/blog/previewing-notebooks-2)
- [Observable Notebooks 2.0 System guide | Observable](https://observablehq.com/notebook-kit/system-guide)
- [Tom MacWright: Observable Notebooks 2.0](https://simonwillison.net/2025/Aug/6/observable-notebooks-20/)
- [notebook kit](https://github.com/observablehq/notebook-kit)
- [Observable Notebooks 2.0 - macwright.com](https://macwright.com/2025/07/31/observable-notebooks-2)
- [Link Search Menu Expand Document Documentation Menu](https://docs.opensearch.org/2.0/observing-your-data/observability-security)

## User:

> 9/17/2026 13:00:14

Graph 2 gave an SyntaxError: Unexpected token

Very interested in Graph 3

## Assistant:

> 9/17/2026 13:02:02

> Summarized the timing patterns and prepared a clarifying question.
>
> - Checking for variable shadowing inside the loop's scope.
> - Check whether the Graph 2 snippet is syntactically valid JS
> - Weighing whether cell mode differences explain the parsing failure.
> - Compute per-player turn latency and deliberation times
> - Summarized the timing patterns and prepared a clarifying question.
> - **Done**

Quick fix on Graph 2 first: the snippet is valid vanilla JS (I checked it against a parser), so the error is coming from how the cell is being compiled rather than the code itself. The only unusual construct in there was the IIFE, so here it is rewritten as a plain function declaration, which also drops a dead `d3.rollup` line I left in by mistake:

```js
function buildControlHistory(log, players) {
  const owner = new Map();
  const frames = [];
  for (const d of log) {
    if (!/established control of/.test(d.text)) continue;
    for (const card of d.cards) {
      if (card.type === "planet-card") owner.set(card.name, d.actor);
    }
    const held = [...owner.values()];
    for (const p of players) {
      frames.push({date: d.date, player: p, planets: held.filter((o) => o === p).length});
    }
  }
  return frames;
}

const controlHistory = buildControlHistory(log, colorScale.domain);
```

If that still throws, tell me the token it names. The other thing worth checking is whether that cell is set to Observable JavaScript mode instead of vanilla, since the old dialect rejects `const` declarations outright. Notebooks 2.0 keeps the legacy mode around for backwards compatibility, so a cell can end up in it.

## Graph 3

I ran it against your file, and the results are good enough that I'll spoil the ending. Out of 256 turn boundaries, 249 are usable. Median time from handoff to end of turn:

| player | median turn | median wait before first action | median time acting |
|---|---|---|---|
| gimbodo | 19.3 h | 4.5 h | 9 min |
| chris.maliga | 4.2 h | 47 min | 6 min |
| Beans | 3.6 h | 29 min | 7 min |
| Yod25 | 3.4 h | 27 min | 36 min |
| baconarray | 2.8 h | 26 min | 37 min |
| gregholmes04 | 1.6 h | 10 min | 4 min |

The split into two columns is what makes this interesting. gimbodo's turns take twelve times longer than gregholmes04's, but once he actually shows up he's done in nine minutes. Yod25 and baconarray are the opposite: they respond fast and then sit on the board for half an hour. So you have two distinct crimes in your group, absentees and deliberators, and they need separate charts.

```js
function buildTurns(log) {
  const isBoundary = (d) => /ended their turn|passed\.$/.test(d.text);
  const turns = [];
  let prev = 0;
  for (let b = 0; b < log.length; b++) {
    if (!isBoundary(log[b])) continue;
    const player = log[b].actor;
    const mine = log.slice(prev + 1, b + 1).filter((d) => d.actor === player);
    if (player && mine.length) {
      const handoff = log[prev].date;
      const first = mine[0].date;
      const end = log[b].date;
      turns.push({
        player,
        handoff,
        latency: Math.max(0.5, (first - handoff) / 60000),
        acting: Math.max(0.5, (end - first) / 60000),
        total: Math.max(0.5, (end - handoff) / 60000),
        actions: mine.length
      });
    }
    prev = b;
  }
  return turns;
}

const turns = buildTurns(log);
```

The `Math.max(0.5, ...)` clamp is load-bearing. Your timestamps only carry minute precision, so a turn resolved in under sixty seconds records as exactly zero and would silently disappear on a log scale.

The box plot, log scale because the spread runs from under a minute to four days:

```js
Plot.plot({
  width,
  height: 300,
  marginLeft: 110,
  x: {
    type: "log",
    grid: true,
    label: "handoff to end of turn",
    ticks: [1 / 60, 0.25, 1, 4, 24, 96],
    tickFormat: (d) => (d < 1 ? `${Math.round(d * 60)}m` : `${d}h`)
  },
  y: {label: null},
  color: colorScale,
  marks: [
    Plot.boxX(turns, {
      x: (d) => d.total / 60,
      y: "player",
      fill: "player",
      sort: {y: "x", reduce: "median", reverse: true},
      tip: true
    })
  ]
})
```

And the two-crimes breakdown as grouped bars:

```js
const turnPhases = turns.flatMap((d) => [
  {player: d.player, phase: "waiting for them", hours: d.latency / 60},
  {player: d.player, phase: "taking the turn", hours: d.acting / 60}
]);

Plot.plot({
  width,
  height: 380,
  marginLeft: 110,
  x: {grid: true, label: "median hours"},
  fy: {label: null},
  y: {label: null},
  color: {
    domain: ["waiting for them", "taking the turn"],
    range: ["#cbd5e1", "#475569"],
    legend: true
  },
  marks: [
    Plot.barX(turnPhases, Plot.groupY({x: "median"}, {
      fy: "player",
      y: "phase",
      x: "hours",
      fill: "phase",
      sort: {fy: "x", reduce: "max", reverse: true}
    })),
    Plot.ruleX([0])
  ]
})
```

Two honest caveats. The medians in each column are computed independently, so waiting plus acting won't add up to the median total, which is why I split them into separate bars rather than stacking. More importantly, wall-clock latency partly measures sleep: if gimbodo is several timezones away from the rest of you, a chunk of that 4.5 hours is night, not indifference.

That points at the fork for the next version. Do you want to keep raw wall clock, which is the funnier and more accusatory chart, or should I add a correction that only counts hours when that player is normally active, using each person's own punchcard from Graph 1 to define their waking window?

## User:

> 9/17/2026 13:06:01

![Screenshot 2026-09-17 130446.png](https://claude.ai/api/02812373-138d-4a58-874b-33e46fa50871/files/de4e7d48-ca4a-4846-ac36-0890f48a2726/preview)

For Graph 2, random chunks of the graph are bumped up higher, I did controlhistory as vanilla JS cell and put the plot in a observable js cell.

## Assistant:

> 9/17/2026 13:06:36

> Analyzing timestamp overlaps to explain a chart's doubled bars.
>
> - Diagnosing unusual spikes in a planet count graph.
> - Check for duplicate timestamps among control events
> - Analyzing timestamp overlaps to explain a chart's doubled bars.
> - **Done**

Found it, and it's the minute-precision timestamps again. Your log has 64 control events but only 51 distinct timestamps, with 13 minutes containing two events each. `Plot.areaY` stacks every value that shares an x position, so those doubled-up minutes get summed on top of each other and the column jumps to roughly twice the real total. That also explains the white bands: with `curve: "step"` a duplicated x makes the path double back on itself, so the fill breaks.

Fix is to emit one snapshot per distinct timestamp instead of per event, keeping the final state for that minute:

```js
function buildControlHistory(log, players) {
  const owner = new Map();
  const byDate = new Map();
  for (const d of log) {
    if (!/established control of/.test(d.text)) continue;
    for (const card of d.cards) {
      if (card.type === "planet-card") owner.set(card.name, d.actor);
    }
    const held = [...owner.values()];
    byDate.set(+d.date, players.map((p) => ({
      date: d.date,
      player: p,
      planets: held.filter((o) => o === p).length
    })));
  }
  return [...byDate.values()].flat();
}

const controlHistory = buildControlHistory(log, colorScale.domain);
```

`Map.set` on an existing key keeps the original insertion position, so the output stays chronological without a sort. The plot cell needs no changes.

Two things you'll notice once it's clean. The total tops out around 30, which excludes home planets since those are never "established", so add 3 per player to the baseline if you want true holdings. And the flat stretches are real: those are the weeks where nobody took anything from anybody.

Still want the timezone-corrected version of Graph 3, or is raw wall clock the version you're taking to your friends?

## User:

> 9/17/2026 13:13:57

For graph 3, could you give me the code for the text table you generated

## Assistant:

> 9/17/2026 13:14:19

> Drafting both a table widget and matching markdown version.
>
> - Drafting both a table widget and matching markdown version.
> - **Done**

Here's the same table as an Observable cell. It needs a minute formatter, since the values span nine minutes to four days:

```js
function fmtMinutes(m) {
  if (m < 60) return `${Math.round(m)} min`;
  if (m < 60 * 48) return `${(m / 60).toFixed(1)} h`;
  return `${(m / 1440).toFixed(1)} d`;
}

const turnStats = d3.groups(turns, (d) => d.player)
  .map(([player, rows]) => ({
    player,
    turns: rows.length,
    medianTurn: d3.median(rows, (d) => d.total),
    medianWait: d3.median(rows, (d) => d.latency),
    medianActing: d3.median(rows, (d) => d.acting),
    longest: d3.max(rows, (d) => d.total)
  }))
  .sort((a, b) => b.medianTurn - a.medianTurn);
```

Then either an interactive table with sortable headers:

```js
Inputs.table(turnStats, {
  header: {
    player: "Player",
    turns: "Turns",
    medianTurn: "Median turn",
    medianWait: "Median wait",
    medianActing: "Median acting",
    longest: "Longest turn"
  },
  format: {
    medianTurn: fmtMinutes,
    medianWait: fmtMinutes,
    medianActing: fmtMinutes,
    longest: fmtMinutes
  },
  layout: "auto"
})
```

Or a rendered Markdown version, which is closer to what I showed you and easier to copy out of the notebook:

```js
md`| player | turns | median turn | median wait | median acting | longest |
|---|--:|--:|--:|--:|--:|
${turnStats.map((d) => `| ${d.player} | ${d.turns} | ${fmtMinutes(d.medianTurn)} | ${fmtMinutes(d.medianWait)} | ${fmtMinutes(d.medianActing)} | ${fmtMinutes(d.longest)} |`).join("\n")}`
```

Same caveat as before: each median is computed over its own column, so wait plus acting won't equal the median turn for any given row.

If the real destination is a Discord message rather than the notebook, say so and I'll swap the Markdown cell for one that emits a fixed-width block inside triple backticks, which survives paste-in much better than a pipe table.

## User:

> 9/17/2026 13:21:15

Alright lets do graphs 4 and 5 next

## Assistant:

> 9/17/2026 13:23:38

> Coding functions to tally victory points over time.
>
> - Analyzing relationship graphs from trade and voting events.
> - Survey victory point events and trade event structure
> - Verifying game log data for trades and victory points.
> - List revealed and scored objective names to determine point values
> - Sorting out the revealed public game objectives.
> - Compute victory point standings from scoring events
> - Tallying scores to find the standings in a close contest.
> - Compute trade pair matrix and per-player trade volume
> - Coding functions to tally victory points over time.
> - **Done**

Both are in the data cleanly. Findings first, then code.

## Graph 4: trade network

53 trades, and 21 of them are one-way gifts with no "in exchange for". 14 of the 15 possible pairings have traded at least once. Beans, playing Hacan, appears in 29 of the 53, more than half the trades in the game. The only pair that has never traded is chris.maliga and gregholmes04.

| pair | trades |
|---|--:|
| Beans / baconarray | 11 |
| Beans / chris.maliga | 10 |
| Beans / gregholmes04 | 4 |
| Yod25 / chris.maliga | 4 |

Trade events always carry exactly two player tags, so extraction is reliable:

```js
function buildTradeMatrix(log, players) {
  const index = new Map(players.map((p, i) => [p, i]));
  const matrix = players.map(() => players.map(() => 0));
  for (const d of log) {
    if (!/ traded /.test(d.text)) continue;
    const from = d.players[0]?.name;
    const to = d.players[1]?.name;
    if (!index.has(from) || !index.has(to)) continue;
    matrix[index.get(from)][index.get(to)] += 1;
    matrix[index.get(to)][index.get(from)] += 1;
  }
  return matrix;
}

function tradeChord(log, scale, size) {
  const players = scale.domain;
  const matrix = buildTradeMatrix(log, players);
  const outer = size / 2 - 95;
  const inner = outer - 14;
  const chords = d3.chord().padAngle(0.05).sortSubgroups(d3.descending)(matrix);
  const arc = d3.arc().innerRadius(inner).outerRadius(outer);
  const ribbon = d3.ribbon().radius(inner);
  const color = d3.scaleOrdinal(players, scale.range);

  const svg = d3.create("svg")
    .attr("viewBox", [-size / 2, -size / 2, size, size])
    .attr("style", "max-width: 100%; height: auto; font: 12px sans-serif;");

  svg.append("g").selectAll("path").data(chords.groups).join("path")
    .attr("d", arc)
    .attr("fill", (d) => color(players[d.index]))
    .attr("stroke", "white");

  svg.append("g").attr("fill-opacity", 0.65).selectAll("path").data(chords).join("path")
    .attr("d", ribbon)
    .attr("fill", (d) => color(players[d.source.index]))
    .attr("stroke", "white")
    .append("title")
    .text((d) => `${players[d.source.index]} and ${players[d.target.index]}: ${d.source.value} trades`);

  svg.append("g").selectAll("text").data(chords.groups).join("text")
    .attr("transform", (d) => {
      const mid = (d.startAngle + d.endAngle) / 2;
      const flip = mid > Math.PI ? "rotate(180)" : "";
      return `rotate(${(mid * 180) / Math.PI - 90}) translate(${outer + 10}) ${flip}`;
    })
    .attr("text-anchor", (d) => ((d.startAngle + d.endAngle) / 2 > Math.PI ? "end" : "start"))
    .attr("dy", "0.35em")
    .text((d) => `${players[d.index]} (${d.value})`);

  return svg.node();
}

tradeChord(log, colorScale, Math.min(width, 640))
```

The count goes into both `[i][j]` and `[j][i]`, which is the standard symmetric setup for an undirected chord. Each player's arc length then equals their total trade count, which is why the numbers in the labels sum to 106 rather than 53.

If the chord ends up too tangled to read, the same matrix works as a Plot cell grid, which is duller but easier to scan:

```js
Plot.plot({
  width: 520, height: 420, marginLeft: 100, marginBottom: 90,
  x: {domain: colorScale.domain, tickRotate: -35, label: null},
  y: {domain: colorScale.domain, label: null},
  color: {scheme: "Blues", legend: true, label: "trades"},
  marks: [
    Plot.cell(buildTradeMatrix(log, colorScale.domain).flatMap((row, i) =>
      row.map((v, j) => ({a: colorScale.domain[i], b: colorScale.domain[j], v}))
    ), {x: "a", y: "b", fill: "v", inset: 0.5, tip: true})
  ]
})
```

## Graph 5: the VP race

Current standings, and it is brutally tight: chris.maliga 7, Beans 7, gimbodo 6, baconarray 6, Yod25 5, gregholmes04 5. That's 36 points across 35 scoring events.

The reason the event count and point total differ by one is an Imperial primary where Beans scored an objective and took the Mecatol Rex point in the same log entry, so that one entry is worth 2. Yod25 has the custodians point.

One thing worth knowing about your own game: of the 8 revealed public objectives, the last three are Stage II, and none of them has been scored yet. Every point on the board so far came from a Stage I or secret objective. The code below still needs the Stage II lookup, because the log records objective names but never their point values, and the first time someone takes Reclaim Ancient Monuments the chart would silently undercount by one.

```js
const STAGE_II = new Set([
  "Centralize Galactic Trade", "Conquer the Weak", "Form Galactic Brain Trust", "Found a Golden Age",
  "Galvanize the People", "Manipulate Galactic Law", "Master the Sciences", "Revolutionize Warfare",
  "Subdue the Galaxy", "Unify the Colonies", "Achieve Supremacy", "Become a Legend",
  "Command an Armada", "Construct Massive Cities", "Control the Borderlands", "Hold Vast Reserves",
  "Patrol Vast Territories", "Protect the Border", "Reclaim Ancient Monuments", "Rule Distant Lands"
]);

function buildScoring(log) {
  const events = [];
  for (const d of log) {
    let points = 0;
    const reasons = [];
    if (/scored the/.test(d.text)) {
      for (const card of d.cards) {
        if (card.type !== "objective-card") continue;
        const value = STAGE_II.has(card.name) ? 2 : 1;
        points += value;
        reasons.push(`${card.name} (${value})`);
      }
    }
    if (/victory point for controlling Mecatol Rex/.test(d.text)) {
      points += 1;
      reasons.push("Mecatol Rex");
    }
    if (/custodians token/.test(d.text) && /victory point/.test(d.text)) {
      points += 1;
      reasons.push("custodians");
    }
    if (points > 0 && d.actor) {
      events.push({date: d.date, player: d.actor, points, reason: reasons.join(", ")});
    }
  }
  return events;
}

function buildVpRace(log, players) {
  const running = new Map(players.map((p) => [p, 0]));
  const rows = players.map((p) => ({date: log[0].date, player: p, vp: 0}));
  for (const e of buildScoring(log)) {
    running.set(e.player, running.get(e.player) + e.points);
    for (const p of players) rows.push({date: e.date, player: p, vp: running.get(p)});
  }
  const end = log[log.length - 1].date;
  for (const p of players) rows.push({date: end, player: p, vp: running.get(p)});
  return rows;
}

const vpRace = buildVpRace(log, colorScale.domain);
const rounds = log.filter((d) => /Public objective revealed/.test(d.text));
const finalVp = vpRace.filter((d) => +d.date === +log[log.length - 1].date);
```

Note that this emits a full six-player snapshot at every scoring moment rather than one row per event. Lines don't stack the way areas do, so the duplicate-timestamp problem from Graph 2 can't bite here, but you do need every series present at every x or the step interpolation draws diagonal shortcuts across the gaps.

```js
Plot.plot({
  width,
  height: 360,
  marginRight: 130,
  y: {grid: true, label: "victory points", domain: [0, 10]},
  x: {label: null},
  color: colorScale,
  marks: [
    Plot.ruleY([10], {stroke: "#bbb", strokeDasharray: "4 4"}),
    Plot.ruleX(rounds, {x: "date", stroke: "#eee"}),
    Plot.text(rounds, {x: "date", y: 10, text: (d, i) => `R${i + 1}`, dy: -8, fill: "#aaa"}),
    Plot.lineY(vpRace, {
      x: "date", y: "vp", stroke: "player",
      curve: "step-after", strokeWidth: 2, tip: true
    }),
    Plot.text(finalVp, Plot.dodgeY({
      x: "date", y: "vp", text: (d) => `${d.player} ${d.vp}`,
      fill: "player", textAnchor: "start", dx: 8
    })),
    Plot.ruleY([0])
  ]
})
```

The `Plot.dodgeY` on the labels matters because you have three ties right now, and without it the pairs at 7, 6, and 5 print directly on top of each other.

Two caveats. The round rules come from public objective reveals, but your first two were revealed in the same minute at setup, so R1 and R2 will overlap at the left edge; drop the first entry from `rounds` if that bothers you. And Support for the Throne can move a point between players without either a score event or a "victory point" phrase in some log variants, though your log has no such transfers, so the running totals are exact as of now.

Want me to add a stacked "where the points came from" companion chart, breaking each player's total into Stage I, secrets, and Mecatol? That's a two-line change to `buildScoring` since it's already recording the reason.

Powered by Claude Exporter (https://www.ai-chat-exporter.net)
