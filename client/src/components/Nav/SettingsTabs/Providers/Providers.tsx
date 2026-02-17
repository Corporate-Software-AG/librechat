import React from 'react';
import ToggleSwitch from '../ToggleSwitch';
import { useLocalize } from '~/hooks';
import store from '~/store';

const toggleSwitchConfigs = [
    {
        stateAtom: store.enableAppleIntelligence,
        localizationKey: 'com_nav_enable_apple_intelligence',
        switchId: 'enableAppleIntelligence',
        hoverCardText: 'com_nav_enable_apple_intelligence_description',
        key: 'enableAppleIntelligence',
    },
];

function Providers() {
    const localize = useLocalize();

    return (
        <div className="flex flex-col gap-3 p-1 text-sm text-text-primary">
            <div className="border-b border-border-medium pb-3 last-of-type:border-b-0">
                <p className="text-text-secondary">
                    {localize('com_nav_providers_description') ||
                        'Enable or disable AI providers. Disabled providers will not appear in the endpoint selector.'}
                </p>
            </div>
            {toggleSwitchConfigs.map((config) => (
                <div key={config.key} className="pb-3">
                    <ToggleSwitch
                        stateAtom={config.stateAtom}
                        localizationKey={config.localizationKey}
                        hoverCardText={config.hoverCardText}
                        switchId={config.switchId}
                    />
                </div>
            ))}
        </div>
    );
}

export default React.memo(Providers);
