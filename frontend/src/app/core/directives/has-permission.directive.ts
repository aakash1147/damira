import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  inject,
  effect,
} from '@angular/core';
import { AuthService } from '../services/auth.service';

@Directive({
  selector: '[hasPermission]',
  standalone: true,
})
export class HasPermissionDirective {
  private authService = inject(AuthService);
  private templateRef = inject(TemplateRef<any>);
  private viewContainer = inject(ViewContainerRef);

  private requiredPermission: [string, string] | null = null;
  private isVisible = false;

  @Input() set hasPermission(permission: [string, string]) {
    this.requiredPermission = permission;
    this.updateView();
  }

  constructor() {
    effect(() => {
      // Re-evaluate when user permissions signal changes
      this.authService.userPermissions();
      this.updateView();
    });
  }

  private updateView(): void {
    if (!this.requiredPermission) {
      if (!this.isVisible) {
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.isVisible = true;
      }
      return;
    }

    const [module, action] = this.requiredPermission;
    const hasAccess = this.authService.hasPermission(module, action);

    if (hasAccess && !this.isVisible) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.isVisible = true;
    } else if (!hasAccess && this.isVisible) {
      this.viewContainer.clear();
      this.isVisible = false;
    }
  }
}
