const moduleDirective = angular.module('uDomo.Directive');

export function changeImage() {
  return moduleDirective
    .directive('ChangeImage', () => (scope, element, attrs) =>
      element.css(
        {
          'background-image': `url(${ attrs.Image })`,
          'background-size': 'cover',
        }
      )
  );
}

export function targetBlank() {
  return moduleDirective
    .directive('targetBlank', () => Object.assign(
      {
        compile: (element) => {
          const elems = element.prop('tagName') === 'A' ? element : element.find('a');
          elems.attr('target', '_blank');
        },
      })
    );
}

export function showErrors() {
  return moduleDirective
    .directive('showErrors', () => Object.assign(
      {
        restrict: 'A',
        require: '^form',
        link: (scope, el, attrs, formCtrl) => {
          const inputNgEl = angular.element(el[0].querySelector('[name]'));
          inputNgEl.bind('blur', () => {
            el.toggleClass('has-error', formCtrl[inputNgEl.attr('name')].$invalid);
          });
        },
      })
  );
}
