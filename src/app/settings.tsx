import { createFileRoute } from '@tanstack/react-router';
import { SettingsComponent } from '~/components/settings';

export const Route = createFileRoute('/settings')({
  component: SettingsComponent,
});