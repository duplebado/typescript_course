import { isEqual } from "lodash";
import { getObjectId } from "utils/helper";
import { ComponentProps } from "utils/types/components";
import { AnswerInputProps, FormatterProps } from "utils/types/formatters";
import { PolicyProps } from "utils/types/policy";
import {
    ApprovalRequestProps,
    TransactionProps,
} from "utils/types/transactions";
import { checkNotEmpty } from "utils/validator";
import { getTimeInSecs } from "./tsHelper";

export const componentDisabled = ({
    name,
    isStructure,
    componentCategory,
    componentCategoryId,
}: ComponentProps) => {
    const categoryId = getObjectId(componentCategory, componentCategoryId);
    return (
        !checkNotEmpty(name) ||
        !checkNotEmpty(isStructure) ||
        !checkNotEmpty(categoryId)
    );
};

export const formatterDisabled = (activeFormatter: FormatterProps) => {
    const { name, inputs } = activeFormatter;

    for (let i = 0; i < inputs.length; i++) {
        const { type, label } = inputs[i];
        if (!checkNotEmpty(type) || !checkNotEmpty(label)) {
            return true;
        }
    }

    return (
        !checkNotEmpty(name) ||
        inputs.length === 0 ||
        !checkNotEmpty(activeFormatter.function)
    );
};

export const policyDisabled = ({ name, documentTypeIds }: PolicyProps) => {
    return !checkNotEmpty(name) || documentTypeIds.length === 0;
};

export const checkRequired = (
    required: boolean | undefined,
    value: StringOrNull
): ArrayofBoolAndString =>
    required && (!value || value.length == 0) && value != "0"
        ? [true, "Required"]
        : [false, ""];

export const runValidations = (
    defaultRequired: RequiredValidationFunc,
    otherValidations: ValidationFuncs,
    value: StringOrNull,
    required: boolean | undefined,
    setError: React.Dispatch<React.SetStateAction<string>>
): void => {
    const [notValid, errorMessage] = defaultRequired(required, value);

    if (notValid) {
        setError(errorMessage);
        return;
    }

    if (otherValidations) {
        for (let i = 0; i < otherValidations.length; i++) {
            const [notValid, errorMessage] = otherValidations[i](value);

            if (notValid) {
                setError(errorMessage);
                return;
            }
        }
    }

    setError("");
};

export const floorPlanRevisionDateValidation = (
    previousDate: StringOrNull,
    nextDate: StringOrNull
) => [
    (currentDate: StringOrNull | number | Date): [boolean, string] => {
        if (previousDate === null || currentDate === null) {
            return [false, ""];
        }
        const previousRevisionDate = getTimeInSecs(previousDate);
        const currentRevisionDate = getTimeInSecs(currentDate);

        if (
            previousRevisionDate &&
            currentRevisionDate &&
            previousRevisionDate > currentRevisionDate
        ) {
            return [true, "date should be after previous revision date"];
        }

        return [false, ""];
    },
    (currentDate: StringOrNull): [boolean, string] => {
        if (nextDate === null || currentDate === null) {
            return [false, ""];
        }
        const nextRevisionDate = getTimeInSecs(nextDate);
        const currentRevisionDate = getTimeInSecs(currentDate);

        if (
            nextRevisionDate &&
            currentRevisionDate &&
            nextRevisionDate < currentRevisionDate
        ) {
            return [true, "date should be before next revision date"];
        }

        return [false, ""];
    },
];

export const floorDisabled = (activeFloor: any) => {
    const { name, index, activationDate, spaces, floorPlans } = activeFloor;
    let isDisabled = false;
    isDisabled =
        !checkNotEmpty(name) ||
        !checkNotEmpty(index) ||
        !checkNotEmpty(activationDate);
    if (isDisabled) {
        return isDisabled;
    }
    if (spaces.length !== 0) {
        for (let i = 0; i < spaces.length; i++) {
            const { name, type, grossArea, efficiencyRatio, activationDate } =
                spaces[i];
            isDisabled =
                !checkNotEmpty(name) ||
                !checkNotEmpty(type) ||
                !checkNotEmpty(grossArea) ||
                !checkNotEmpty(efficiencyRatio) ||
                !checkNotEmpty(activationDate);
            if (isDisabled) {
                return isDisabled;
            }
        }
    }
    if (floorPlans.length !== 0) {
        for (let i = 0; i < floorPlans.length; i++) {
            const { revisionDate, unitsNumber, whollyOwned, grossArea } =
                floorPlans[i];
            isDisabled =
                !checkNotEmpty(revisionDate) ||
                !checkNotEmpty(unitsNumber) ||
                !checkNotEmpty(whollyOwned) ||
                !checkNotEmpty(grossArea);
            if (isDisabled) {
                return isDisabled;
            }

            let previousRevisionDate = null;
            let nextRevisionDate = null;

            if (i > 0) {
                ({ revisionDate: previousRevisionDate } = floorPlans[i - 1]);
            }

            if (i + 1 <= floorPlans.length - 1) {
                ({ revisionDate: nextRevisionDate } = floorPlans[i + 1]);
            }

            const validations = floorPlanRevisionDateValidation(
                previousRevisionDate,
                nextRevisionDate
            );

            for (let j = 0; j < validations.length; j++) {
                [isDisabled] = validations[j](revisionDate);
                if (isDisabled) {
                    return isDisabled;
                }
            }
        }
    }

    return isDisabled;
};

export const isValidNumber = (value: any): boolean => {
    const validTypes = ["string", "number"];

    if (!validTypes.includes(typeof value)) return false;

    if (!value || isNaN(parseInt(value))) return false;

    return true;
};

export const formatterAnswerDisabled = (
    answerInputs: AnswerInputProps[],
    formatterFunction: string | null
) => {
    if (!checkNotEmpty(formatterFunction)) {
        return true;
    }
    for (let i = 0; i < answerInputs.length; i++) {
        const { answer, label } = answerInputs[i];

        if (!checkNotEmpty(label)) return true;

        for (const [key, value] of Object.entries(answer)) {
            if (!checkNotEmpty(value)) return true;
        }
    }
    return false;
};

export const checkEmpty = (value: null | string) => {
    return value === null || value === "";
};

export const checkIfUnsavedData = (oldValue: any, newValue: any) => {
    return !isEqual(oldValue, newValue);
};

export const checkIfValidTimeInput = (
    key: string,
    value: string | number
): boolean => {
    if (key === "hours") return Number(value) < 24;

    if (key === "minutes") return Number(value) < 60;

    return false;
};

export const checkIfValidNodeConditions = (formConditions: any) => {
    for (let i = 0; i < formConditions.length; i++) {
        const { list, operator } = formConditions[i];
        if (!checkNotEmpty(operator) || list.length === 0) {
            return false;
        } else {
            for (let j = 0; j < list.length; j++) {
                const { type, answer, comparator, parameter, parameter2 } =
                    list[j];

                if (type === "PARAM_VALUE") {
                    if (
                        !checkNotEmpty(answer.answer) ||
                        !checkNotEmpty(comparator) ||
                        !checkNotEmpty(parameter.parameterId)
                    ) {
                        return false;
                    } else {
                        if (answer.answer.hasOwnProperty("days")) {
                            const { days, months, years } = answer.answer;
                            if (
                                !checkNotEmpty(days) ||
                                !checkNotEmpty(months) ||
                                !checkNotEmpty(years)
                            ) {
                                return false;
                            }
                        }
                    }
                } else if (type === "PARAM_PARAM") {
                    if (
                        !checkNotEmpty(comparator) ||
                        !checkNotEmpty(parameter.parameterId) ||
                        !checkNotEmpty(parameter2.parameterId)
                    ) {
                        return false;
                    }
                } else {
                    if (
                        !checkNotEmpty(comparator) ||
                        !checkNotEmpty(parameter.parameterId)
                    ) {
                        return false;
                    }
                }
            }
        }
    }

    return true;
};

export const transactionDisabled = ({
    identifier,
    ownerId,
    policyId,
    tenantId,
    premises,
}: TransactionProps) => {
    const { floorIds, property } = premises[0];
    for (let i = 0; i < floorIds.length; i++) {
        const { id, spaceIds, floorPortion } = floorIds[i];
        if (
            id === null ||
            spaceIds.length === 0 ||
            !checkNotEmpty(floorPortion)
        ) {
            return true;
        }
    }

    if (!checkNotEmpty(property)) {
        return true;
    }

    return (
        !checkNotEmpty(identifier) ||
        !checkNotEmpty(ownerId) ||
        !checkNotEmpty(policyId) ||
        !checkNotEmpty(tenantId)
    );
};

export const approvalRequestDisabled = ({
    manager,
    approvalType,
    note,
}: ApprovalRequestProps) =>
    !checkNotEmpty(manager) ||
    !checkNotEmpty(approvalType) ||
    !checkNotEmpty(note);
