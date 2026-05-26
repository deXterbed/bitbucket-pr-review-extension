export const NOTIFICATION_CSS = `
.pr-review-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 12px 20px;
  border-radius: 4px;
  color: white;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 9999;
  animation: prSlideIn 0.3s ease-out;
  display: flex;
  align-items: center;
  gap: 8px;
}
.pr-review-notification.success { background-color: #36B37E; }
.pr-review-notification.error   { background-color: #FF5630; }
.pr-review-notification.info    { background-color: #0052CC; }
@keyframes prSlideIn {
  from { transform: translateX(100%); opacity: 0; }
  to   { transform: translateX(0); opacity: 1; }
}
`;

export const BUTTON_CSS = `
#review-pr-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-left: 10px;
  padding: 6px 12px;
  background-color: #2684FF;
  color: #FFFFFF;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-weight: 500;
  font-size: 14px;
  transition: background-color 0.2s;
  box-shadow: 0 1px 2px rgba(9, 30, 66, 0.08);
}
#review-pr-button:hover  { background-color: #0065FF; }
#review-pr-button:active { background-color: #0747A6; }
#review-pr-button:disabled {
  background-color: #B3D4FF;
  cursor: not-allowed;
}
#review-pr-button .spinner { display: none; }
#review-pr-button.loading .spinner { display: inline-block; }
`;
