import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { UiModule } from '../../../ui/ui.module';
import { T } from '../../../t.const';
import { IssueIntegrationCfg, IssueProvider, IssueProviderKey } from '../issue.model';
import { IssueModule } from '../issue.module';
import {
  DEFAULT_ISSUE_PROVIDER_CFGS,
  ISSUE_PROVIDER_FORM_CFGS_MAP,
  ISSUE_PROVIDER_HUMANIZED,
} from '../issue.const';
import { FormGroup, FormsModule } from '@angular/forms';
import { ConfigFormSection } from '../../config/global-config.model';
import { DialogConfirmComponent } from '../../../ui/dialog-confirm/dialog-confirm.component';
import { IssueProviderActions } from '../store/issue-provider.actions';
import { NgForOf, NgIf } from '@angular/common';
import { JiraViewComponentsModule } from '../providers/jira/jira-view-components/jira-view-components.module';
import { OpenProjectAdditionalCfgComponent } from '../providers/open-project/open-project-view-components/openproject-cfg/open-project-additional-cfg.component';
import { nanoid } from 'nanoid';
import { HelperClasses } from '../../../app.constants';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'dialog-edit-issue-provider',
  standalone: true,
  imports: [
    UiModule,
    IssueModule,
    NgIf,
    NgForOf,
    JiraViewComponentsModule,
    OpenProjectAdditionalCfgComponent,
    FormsModule,
    MatInputModule,
  ],
  templateUrl: './dialog-edit-issue-provider.component.html',
  styleUrl: './dialog-edit-issue-provider.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogEditIssueProviderComponent {
  T: typeof T = T;
  readonly d = inject<{
    issueProvider?: IssueProvider;
    issueProviderKey?: IssueProviderKey;
  }>(MAT_DIALOG_DATA);

  form = new FormGroup({});

  issueProviderKey: IssueProviderKey = (this.d.issueProvider?.issueProviderKey ||
    this.d.issueProviderKey) as IssueProviderKey;
  issueProvider?: IssueProvider = this.d.issueProvider;
  isEdit: boolean = !!this.issueProvider;

  model: Partial<IssueProvider> = this.isEdit
    ? { ...this.issueProvider }
    : {
        ...DEFAULT_ISSUE_PROVIDER_CFGS[this.issueProviderKey],
        id: nanoid(),
        issueProviderKey: this.issueProviderKey,
        isEnabled: true,
      };
  configFormSection: ConfigFormSection<IssueIntegrationCfg> =
    ISSUE_PROVIDER_FORM_CFGS_MAP[this.issueProviderKey];

  fields = this.configFormSection.items;

  title: string = ISSUE_PROVIDER_HUMANIZED[this.issueProviderKey];

  private _matDialogRef: MatDialogRef<DialogEditIssueProviderComponent> =
    inject(MatDialogRef);

  private _matDialog = inject(MatDialog);
  private _store = inject(Store);

  submit(isSkipClose = false): void {
    if (this.form.valid) {
      if (this.isEdit) {
        this._store.dispatch(
          IssueProviderActions.updateIssueProvider({
            issueProvider: {
              id: this.issueProvider!.id,
              changes: this.model as IssueProvider,
            },
          }),
        );
      } else {
        this._store.dispatch(
          IssueProviderActions.addIssueProvider({
            issueProvider: this.model as IssueProvider,
          }),
        );
      }
      if (!isSkipClose) {
        this._matDialogRef.close(this.model);
      }
    }
  }

  cancel(): void {
    this._matDialogRef.close();
  }

  remove(): void {
    this._matDialog
      .open(DialogConfirmComponent, {
        restoreFocus: true,
        data: {
          cancelTxt: T.G.CANCEL,
          okTxt: T.G.DELETE,
          message:
            // TODO translate
            'Are you sure you want to delete this issue provider? Deleting it means that all previously imported issue tasks will loose their reference. This cannot be undone.',
          // message: T.F.TIME_TRACKING.D_IDLE.SIMPLE_COUNTER_CONFIRM_TXT,
          // translateParams: {
          //   nr: 2,
          // },
        },
      })
      .afterClosed()
      .subscribe((isConfirm: boolean) => {
        if (isConfirm) {
          this._store.dispatch(
            IssueProviderActions.deleteIssueProvider({
              id: this.issueProvider!.id,
            }),
          );
          this._matDialogRef.close();
        }
      });
  }

  customCfgCmpSave(cfgUpdates: IssueIntegrationCfg): void {
    console.log('customCfgCmpSave()', cfgUpdates);
    Object.keys(cfgUpdates).forEach((key) => {
      this.model![key] = cfgUpdates[key];
    });
  }

  changeEnabled(isEnabled: boolean): void {
    // this.model.isEnabled = isEnabled;
    this.model = {
      ...this.model,
      isEnabled,
    };
    this.submit(true);
  }

  protected readonly HelperClasses = HelperClasses;
}