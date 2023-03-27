import { adminClient, client } from "apollo";
import { isEqual } from "lodash";
import { getNewContract } from "store/contracts/features/helper";
import { updatePolicyAnswers } from "store/policies/features/policiesSlice";
import { updateTransactionAnswers } from "store/transactions/features/transactionsSlice";
import { checkIfAdminURL } from "utils/checkAdmin";
import { formatDate, uploadToAWS } from "utils/helper";
import { checkIfUnsavedData } from "utils/tsValidator";
import { DocContent } from "utils/types/components";
import { FloorPlanProps, SpaceProps } from "utils/types/inventory/properties";
import {
    DropdownProps,
    ReviewStatusLocalType,
    ReviewStatusMutationType,
    StringOrUndefined,
} from "utils/types/miscellaneous";
import { AnswerProps, PolicyProps } from "utils/types/policy";
import { checkNotEmpty, convertDateToISO } from "utils/validator";
import { ContractTimelineEventType } from "./types/contracts/timeline";
import {
    ConditionsInputProps,
    NodeParametersInputProps,
    ParameterInput,
} from "./types/nodes";

export const getNewReviewer = (
    reviewFlag?: boolean,
    id?: string | undefined,
    firstName?: string | undefined,
    lastName?: string | undefined
) => ({
    id: reviewFlag && id ? id : null,
    firstName: reviewFlag && firstName ? firstName : null,
    lastName: reviewFlag && lastName ? lastName : null,
});

export const getNewReviewTime = (reviewFlag: boolean) =>
    reviewFlag ? new Date(Date.now()) : null;

type GetReviewFlagAndReviewStatusParamType = {
    reviewFlag: boolean;
    reviewStatus: ReviewStatusLocalType;
    [key: string]: any;
};

export const getReviewFlagAndReviewStatus = (
    activeEntityObject: GetReviewFlagAndReviewStatusParamType,
    frozenEntityObject: GetReviewFlagAndReviewStatusParamType
): [boolean, ReviewStatusMutationType] => {
    const { reviewStatus: editedReviewStatus } = activeEntityObject;
    const { reviewFlag: frozenReviewFlag } = frozenEntityObject || {};

    let newReviewFlag = activeEntityObject.reviewFlag;

    let date: Date | string | null = editedReviewStatus.date;

    if (date && typeof date === "object") {
        date = date.toISOString();
    } else if (date) {
        date = date;
    } else {
        date = null;
    }

    const userId = editedReviewStatus.user ? editedReviewStatus.user.id : null;

    const newReviewStatus = {
        date,
        userId,
    };

    if (frozenEntityObject) {
        const activeCopy = JSON.parse(JSON.stringify(activeEntityObject));
        delete activeCopy.reviewFlag;
        delete activeCopy.reviewStatus;

        const frozenCopy = JSON.parse(JSON.stringify(frozenEntityObject));
        delete frozenCopy.reviewFlag;
        delete frozenCopy.reviewStatus;

        const edited = !checkIfTwoObjectsAreEqual(activeCopy, frozenCopy);

        if (edited && frozenReviewFlag) {
            newReviewStatus.date = null;
            newReviewStatus.userId = null;
            newReviewFlag = false;
        }
    }

    return [newReviewFlag, newReviewStatus];
};

export const getFrozenObjectCopy = (obj: object): object =>
    Object.freeze(JSON.parse(JSON.stringify(obj)));

export const checkIfTwoObjectsAreEqual = (
    obj1: object,
    obj2: object
): boolean => JSON.stringify(obj1) === JSON.stringify(obj2);

export const getFormattedValue = (value: any, insertSpace: boolean) => {
    if (value !== "-----" && checkNotEmpty(value)) {
        let formattedString;
        if (value && [".", "-"].includes(value[value.length - 1])) {
            formattedString = value.toLocaleString();
        } else {
            formattedString = Number(value).toLocaleString();
        }
        return insertSpace
            ? formattedString.replace(/,/g, " ")
            : formattedString;
    }
    return value;
};

export const getDeformattedValue = (value: string) => {
    if (checkNotEmpty(value)) {
        let newValue = value.replace(/\s/g, "");
        return newValue.replace(/,/g, "");
    } else {
        return value;
    }
};

export const getPercentage = (x: number, y: number) => {
    if (x === 0 || y === 0) {
        return 0;
    } else if (x > y) {
        return 100;
    }
    return ((x / y) * 100).toFixed(1);
};

export const getUnit = (measurementUnit: string) =>
    measurementUnit === "SQUARE_FOOT" ? "sqft" : "sqm";

export const getLatestFloorPlanArea = (floorPlans: FloorPlanProps[]) => {
    const latestFloorPlan = floorPlans[floorPlans.length - 1];
    return parseInt(latestFloorPlan.grossArea);
};

export const addQuotes = (value: string | null) => {
    if (value === null) {
        return value;
    } else {
        return `"${value}"`;
    }
};

export const getEfficiencyRatio = (value: number) => {
    if (value != 0) {
        return (value * 100).toString().slice(0, 5);
    }
    return value;
};

export const getFilteredSpaces = (
    dateFilter: string | null,
    spaces: SpaceProps[]
) => {
    if (dateFilter !== null && spaces.length !== 0) {
        return spaces.filter(
            ({
                activationDate,
                deactivationDate,
            }: {
                activationDate: string | null;
                deactivationDate: string | null;
            }) => {
                const activationDateCopy = convertDateToISO(
                    activationDate
                ) as any;
                const deactivationDateCopy = convertDateToISO(
                    deactivationDate
                ) as any;

                if (activationDate !== null && deactivationDate !== null) {
                    return (
                        dateFilter >= activationDateCopy &&
                        dateFilter <= deactivationDateCopy
                    );
                } else if (
                    activationDate === null &&
                    deactivationDate !== null
                ) {
                    return dateFilter <= deactivationDateCopy;
                } else if (
                    activationDate !== null &&
                    deactivationDate === null
                ) {
                    return dateFilter >= activationDate;
                } else {
                    return false;
                }
            }
        );
    } else {
        return spaces;
    }
};

export const getTimeInSecs = (date?: string | Date | number) => {
    let result;

    if (date === "today") {
        result = new Date();
    } else {
        result = new Date(date as string | Date | number);
    }

    return result.getTime() ? result.setHours(0, 0, 0, 0) : 0;
};

export const getJSON = (str: string) => {
    try {
        return JSON.parse(str);
    } catch {
        return str;
    }
};

export const getLatestAnswer = ({
    answers,
    answerType,
    parameterId,
    tableId,
    tabIndex,
    setValue,
    emptyValue,
}: {
    answers: AnswerProps[];
    answerType: string;
    parameterId: string;
    tableId: StringOrUndefined;
    tabIndex: number | undefined;
    setValue: any;
    emptyValue: string | object;
}) => {
    let getAnswers;
    if (tableId) {
        getAnswers = answers.filter(
            (obj: AnswerProps) =>
                obj.answerType === answerType &&
                obj.parameter.parameterId === parameterId &&
                obj.parameter.tableId === tableId &&
                obj.parameter.index === tabIndex
        );
        if (getAnswers.length === 0) {
            setValue(emptyValue);
        }
    } else {
        getAnswers = answers.filter(
            (obj: AnswerProps) =>
                obj.answerType === answerType &&
                obj.parameter.parameterId === parameterId &&
                checkIfNotDefined(obj.parameter.tableId)
        );
    }

    const answerSize = getAnswers.length;
    if (answerSize !== 0) {
        const { answer } = getAnswers[answerSize - 1];
        let answerValue = JSON.parse(JSON.stringify(answer));
        answerValue = getJSON(answerValue);
        if (
            answerType === "IMAGE" ||
            answerType === "PERIOD" ||
            answerType === "DURATION" ||
            answerType === "SINGLE_CHOICE" ||
            answerType === "MULTI_CHOICE" ||
            answerType === "TIME"
        ) {
            setValue(answerValue);
        } else {
            setValue(answerValue.value);
        }
    }
};

export const checkIfAnswerExists = ({
    answers,
    answerType,
    parameterId,
    tableId,
    tabIndex,
}: {
    answers: AnswerProps[];
    answerType: string;
    parameterId: string;
    tableId: StringOrUndefined;
    tabIndex: number | undefined;
}) => {
    let getAnswers;
    if (tableId) {
        getAnswers = answers.filter(
            (obj: AnswerProps) =>
                obj.answerType === answerType &&
                obj.parameter.parameterId === parameterId &&
                obj.parameter.tableId === tableId &&
                obj.parameter.index === tabIndex
        );
    } else {
        getAnswers = answers.filter(
            (obj: AnswerProps) =>
                obj.answerType === answerType &&
                obj.parameter.parameterId === parameterId &&
                checkIfNotDefined(obj.parameter.tableId)
        );
    }

    const answerSize = getAnswers.length;
    if (answerSize !== 0) {
        const { answer } = getAnswers[answerSize - 1];
        let answerValue = JSON.parse(JSON.stringify(answer));
        answerValue = getJSON(answerValue);

        if (answerType === "BOOLEAN") {
            let value = answerValue.value;
            value = value == null ? null : value.toString().toUpperCase();
            return checkNotEmpty(value);
        } else if (answerType === "IMAGE") {
            const { url, title } = answerValue;
            return checkNotEmpty(url) && checkNotEmpty(title);
        } else if (
            answerType === "SINGLE_CHOICE" ||
            answerType === "MULTI_CHOICE"
        ) {
            return answerValue.values.length !== 0;
        } else if (answerType === "TIME") {
            const { hours, minutes } = answerValue;
            return hours.length !== 0 || minutes.length !== 0;
        } else if (answerType === "DURATION") {
            const { days, months, years } = answerValue;
            return (
                days.length !== 0 || months.length !== 0 || years.length !== 0
            );
        } else if (answerType === "PERIOD") {
            const { startDate, endDate } = answerValue;
            return startDate.length !== 0 || endDate.length !== 0;
        } else {
            return answerValue.value.length !== 0;
        }
    } else {
        return false;
    }
};

export const updateAnswer = ({
    setValue,
    value,
    index,
    answerType,
    parameterId,
    userId,
    tableId,
    tabIndex,
    dispatch,
}: {
    setValue: any;
    value: any;
    index: number | string;
    answerType: string;
    parameterId: string;
    userId: string | null;
    tableId: string | undefined;
    tabIndex: number | undefined;
    dispatch: any;
}) => {
    setValue(value);
    let answerValue;
    if (
        answerType === "PERIOD" ||
        answerType === "DURATION" ||
        answerType === "SINGLE_CHOICE" ||
        answerType === "MULTI_CHOICE" ||
        answerType === "TIME"
    ) {
        answerValue = value;
    } else {
        answerValue = {
            value,
        };
    }
    let parameter;
    if (tableId) {
        parameter = {
            parameterId,
            tableId,
            index: tabIndex,
        };
    } else {
        parameter = {
            parameterId,
        };
    }
    const answer = {
        index,
        answer: answerValue,
        answerType,
        dateOfAnswer: getCurrentDateTimeISO(),
        parameter,
        userId: userId,
    };
    const updateMethod = checkIfPoliciesPage()
        ? updatePolicyAnswers
        : updateTransactionAnswers;
    dispatch(updateMethod({ answer }));
};

export const getDefinedAnswersCount = (
    parametersList: any,
    answers: AnswerProps[]
) => {
    let definedAnswers = 0;
    {
        parametersList.map((item: any) => {
            const checkIfAnswer = checkIfAnswerExists({
                answers,
                answerType: item.node.answerType,
                parameterId: item.node.id,
                tableId: undefined,
                tabIndex: undefined,
            });
            if (checkIfAnswer) {
                definedAnswers += 1;
            }
        });
    }
    return definedAnswers;
};

export const getCurrentDateTimeISO = () => {
    const dateObj = new Date();
    const timeZoneOffset = dateObj.getTimezoneOffset() * 60000;
    const isoDateTime = new Date(
        dateObj.getTime() - timeZoneOffset
    ).toISOString();
    return isoDateTime;
};

export const getAnswerValue = (
    answer: any,
    answerType: string,
    choices?: any[]
) => {
    let answerValue = JSON.parse(JSON.stringify(answer));
    answerValue = getJSON(answerValue);

    if (answerType === "IMAGE") {
        const { title, url } = answer;
        return title ? { title, url } : "";
    } else if (
        answerType === "SINGLE_CHOICE" ||
        answerType === "MULTI_CHOICE"
    ) {
        const findAnswerText = (code: string) => {
            const found = choices?.find(({ id }) => id === code);

            return found ? found.text : code;
        };
        const result = answerValue.values.map((answer: string) =>
            findAnswerText(answer)
        );
        return result.join(", ");
    } else if (answerType === "TIME") {
        const { hours, minutes } = answerValue;
        if (hours === "" && minutes === "") {
            return "";
        }

        return `${hours ? hours : 0} hour(s) : ${
            minutes ? minutes : 0
        } minute(s)`;
    } else if (answerType === "DURATION") {
        const { days, months, years } = answerValue;

        if (days === "" && months === "" && years === "") {
            return "";
        }

        return `${years ? years : 0} years, ${months ? months : 0} months, ${
            days ? days : 0
        } days`;
    } else if (answerType === "BOOLEAN") {
        const value = answerValue.value;
        return value == null ? "" : value.toString().toUpperCase();
    } else if (answerType === "DATE") {
        const dateString = answerValue.value;
        return dateString ? formatDate(dateString) : "";
    } else {
        return answerValue.value;
    }
};

const getIndex = (
    activeNodeConditions: ConditionsInputProps[],
    activeParameterIndex: number,
    paramType: string
) => {
    let indexOfParam = 0;

    for (let i = 0; i < activeNodeConditions.length; i++) {
        const { list } = activeNodeConditions[i];
        for (let j = 0; j < list.length; j++) {
            const { parameter, parameter2, type } = list[j] as any;
            if (indexOfParam === activeParameterIndex) {
                if (type === "PARAM_PARAM") {
                    if (paramType === "param1") {
                        return parameter.index;
                    }
                    return parameter2.index;
                }
                return parameter.index;
            }

            if (type === "PARAM_PARAM") {
                indexOfParam += 2;
            } else {
                indexOfParam += 1;
            }
        }
    }
};

export const getAnswerValueByParameterId = (
    activePolicy: PolicyProps,
    parameterId: string,
    choices: any[],
    paramterObj: ParameterInput
): string => {
    for (let i = activePolicy.answers.length - 1; i >= 0; i--) {
        const {
            parameter: { parameterId: id, index: AnswerParameterIndex },
            answer,
            answerType,
        }: AnswerProps = activePolicy.answers[i];

        if (id === parameterId && AnswerParameterIndex === paramterObj.index) {
            return getAnswerValue(answer, answerType, choices);
        }
    }

    return "";
};

export const getLatestAnswerValue = ({
    answers,
    answerType,
    parameterId,
}: {
    answers: AnswerProps[];
    answerType: string;
    parameterId: string;
}) => {
    const getAnswers = answers.filter(
        (obj: AnswerProps) =>
            obj.answerType === answerType &&
            obj.parameter.parameterId === parameterId &&
            checkIfNotDefined(obj.parameter.tableId)
    );
    const answersSize = getAnswers.length;
    if (answersSize !== 0) {
        const { answer } = getAnswers[answersSize - 1];
        let answerValue = JSON.parse(JSON.stringify(answer));
        answerValue = getJSON(answerValue);
        return answerValue.value;
    }
};

export const checkIfNotDefined = (value: any) => {
    return value === null || value === undefined;
};

export const getClientType = () => (checkIfAdminURL() ? adminClient : client);

export const replaceDoubleSlash = (text: string | null) => {
    if (text === null) {
        return null;
    } else {
        return text.replace(/\/\//, "");
    }
};

export const checkIfUnsavedContract = (
    activeContract: any,
    oldContractVersion: any
) => {
    const urlPath = window.location.pathname;
    const contractPages = [
        "/contracts/create",
        `/contracts/${activeContract.id}/details`,
    ];
    if (contractPages.includes(urlPath)) {
        const oldVersion =
            urlPath === "/contracts/create"
                ? getNewContract()
                : oldContractVersion;
        if (checkIfUnsavedData(oldVersion, activeContract)) {
            return true;
        }
    }
    return false;
};

export const createOptionsDropdown = (choices?: { text: string }[]) => {
    if (!choices) return [];

    return choices.map(({ text }, key) => ({ key, text, value: text }));
};

export const checkIfPoliciesPage = () =>
    window.location.pathname.includes("policies");

export const updateIterationHelper = (
    answers: any,
    answerType: string,
    parentId: string,
    userId: string,
    type: string
) => {
    let latestAnswers = answers.filter(
        (obj: AnswerProps) =>
            obj.answerType === answerType &&
            obj.parameter.parameterId === parentId &&
            checkIfNotDefined(obj.parameter.tableId)
    );

    latestAnswers = latestAnswers[latestAnswers.length - 1];
    let cloneLatestAnswer = JSON.parse(JSON.stringify(latestAnswers));
    let answerValue;
    if (type === "decrement") {
        answerValue = String(Number(cloneLatestAnswer.answer.value) - 1);
    } else {
        if (cloneLatestAnswer.answer.value == 5) {
            return;
        } else {
            answerValue = String(Number(cloneLatestAnswer.answer.value) + 1);
        }
    }
    cloneLatestAnswer.answer.value = answerValue;
    cloneLatestAnswer.dateOfAnswer = getCurrentDateTimeISO();
    delete cloneLatestAnswer["user"];
    cloneLatestAnswer.userId = userId;
    return [...answers, cloneLatestAnswer];
};

export const setAnswerInput = async (answers: AnswerProps[]) => {
    let answersList = [];

    const latestAnswer: { [key: string]: string } = {};

    for (let i = 0; i < answers.length; i++) {
        const {
            answerType,
            dateOfAnswer,
            parameter,
            user,
            userId,
            fromPolicy,
            index: localTemporaryIndex,
        } = answers[i];

        const { parameterId, index, tableId } = parameter;

        let { answer } = answers[i];

        const key = `${answerType}-${
            index === undefined ? null : index
        }-${parameterId}-${tableId === undefined ? null : tableId}`;

        const numberTypes = ["NUMBER", "NUMBER_UNIT", "NUMBER_PERCENT"];

        if (numberTypes.includes(answerType)) {
            answer = {
                value: answer.value ? Number(answer.value) : answer.value,
            };
        }

        // Upload files to aws
        if (answerType === "IMAGE") {
            const { uploadUrl, file, cdnUrl, title, local } = answer;

            const answerObj = latestAnswer[key];

            const latestImageAnswerTitle = answerObj
                ? JSON.parse(latestAnswer[key]).title
                : null;

            if (local) {
                if (latestImageAnswerTitle !== title) {
                    await uploadToAWS(uploadUrl, file);

                    answer = {
                        title,
                        url: cdnUrl,
                    };
                } else {
                    continue;
                }
            }
        }

        const stringifiedAnswer = JSON.stringify(getJSON(answer));

        const obj = {
            answer: stringifiedAnswer,
            answerType,
            dateOfAnswer,
            parameter,
            userId: userId ? userId : user.id,
        };

        // START ===> To ensure the new answer is not the same as the last

        if (localTemporaryIndex === undefined) {
            latestAnswer[key] = stringifiedAnswer;
        } else if (latestAnswer[key] === stringifiedAnswer) {
            // IGNORE THE ANSWER SINCE IT'S NO DiFFERENT FROM THE LAST
            // This is for all types except IMAGE answerType, IMAGE answerType case is handled in the upload code block
            continue;
        }
        // END ===>

        if (fromPolicy) {
            // @ts-ignore
            obj.fromPolicy = fromPolicy;
        }

        answersList.push(obj);
    }
    return answersList;
};

export const getLatestAnswerObj = ({
    answers,
    answerType,
    parameterId,
    tableId,
    tabIndex,
}: {
    answers: AnswerProps[];
    answerType: String;
    parameterId: String;
    tableId: String | undefined;
    tabIndex: Number | undefined;
}) => {
    let getAnswers;
    if (tableId) {
        getAnswers = answers.filter(
            (obj: AnswerProps) =>
                obj.answerType === answerType &&
                obj.parameter.parameterId === parameterId &&
                obj.parameter.tableId === tableId &&
                obj.parameter.index === tabIndex
        );
    } else {
        getAnswers = answers.filter(
            (obj: AnswerProps) =>
                obj.answerType === answerType &&
                obj.parameter.parameterId === parameterId &&
                checkIfNotDefined(obj.parameter.tableId)
        );
    }

    const answerSize = getAnswers.length;

    if (answerSize !== 0) {
        return JSON.parse(JSON.stringify(getAnswers[answerSize - 1]));
    }
};

export const handleZeroValue = (numberToCheck: number) => {
    return numberToCheck || numberToCheck === 0 ? numberToCheck : null;
};

export const editorContextMenuForceClose = () => {
    const menuQuery = '.tox-toolbar__group > button[title="More..."]';
    const button = document.querySelector(menuQuery) as HTMLElement;
    button?.click();
};

export const getDay = (date: Date) =>
    date.getDate().toString().length > 1
        ? date.getDate()
        : `0${date.getDate()}`;

export const getMonth = (date: Date) =>
    (date.getMonth() + 1).toString().length > 1
        ? date.getMonth() + 1
        : `0${date.getMonth() + 1}`;

export const getAnswers = (
    policyAnswers: AnswerProps[],
    transactionAnswers: AnswerProps[]
) => (checkIfPoliciesPage() ? policyAnswers : transactionAnswers);

export const getTotalNumberOfDays = (
    startDate: string,
    endDate: string
): number => {
    const secondsPerDay = 1000 * 3600 * 24;
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end.getTime() > start.getTime()) {
        return (end.getTime() - start.getTime()) / secondsPerDay + 1;
    }

    return 0;
};

export const getContractTimelineEventColor = (event: string): string => {
    if (event === ContractTimelineEventType.occupation) return "green";
    if (event === ContractTimelineEventType.expiry) return "red";
    if (event === ContractTimelineEventType.rentReview) return "orange";
    if (event === ContractTimelineEventType.expansion) return "blue";
    if (event === ContractTimelineEventType.surrender) return "purple";

    return "";
};

export const getPercentageFromStartDate = (
    startDate: string,
    date: string,
    totalDays: number
) => {
    const days = getTotalNumberOfDays(startDate, date);
    return (days / totalDays) * 100;
};

export const sortContents = (
    contentList: DocContent[],
    documentTypesOptions: DropdownProps[]
) => {
    const sortedListOfIds = documentTypesOptions.map(
        (docs: DropdownProps) => docs.key
    );
    contentList = [...contentList].sort(
        (a, b) =>
            sortedListOfIds.indexOf(a.documentTypeId) -
            sortedListOfIds.indexOf(b.documentTypeId)
    );
    let sortedContent = [];
    for (let i = 0; i < contentList.length; i++) {
        const option = documentTypesOptions.find(
            (obj) => obj.key === contentList[i].documentTypeId
        );
        sortedContent.push({ ...contentList[i], documentName: option?.text });
    }
    return sortedContent;
};

export const checkFromPolicy = (answers: AnswerProps[]) => {
    const transactionPage = window.location.pathname.includes("transactions");
    if (transactionPage) {
        return checkPolicyInAnswers(answers);
    }
    return false;
};

export const checkPolicyInAnswers = (answers: AnswerProps[]) => {
    for (let i = 0; i < answers.length; i++) {
        if (answers[i].fromPolicy) {
            return true;
        }
    }
    return false;
};

export const checkIfFromDeviation = (
    checkFromPolicy: boolean,
    answers: AnswerProps[]
) => {
    const answerSize = answers.length;
    if (checkFromPolicy && answerSize > 1) {
        const firstAnswer = answers[0].answer;
        const latestAnswer = answers[answers.length - 1].answer;
        const { answerType } = answers[0];

        const types = ["NUMBER", "NUMBER_UNIT", "NUMBER_PERCENT"];
        if (types.includes(answerType)) {
            return firstAnswer.value != latestAnswer.value;
        } else if (answerType === "BOOLEAN") {
            return String(firstAnswer.value) != String(latestAnswer.value);
        } else if (answerType === "MULTI_CHOICE") {
            const valuesFirst = firstAnswer.values;
            const valuesLatest = latestAnswer.values;
            if (valuesFirst.length === valuesLatest.length) {
                return !valuesFirst.every((id: string) =>
                    valuesLatest.includes(id)
                );
            }
            return true;
        }

        return !isEqual(firstAnswer, latestAnswer);
    }
    return false;
};

export const getFirstOrLastDateInCurrentYear = (
    day: "first" | "last",
    delimeter: string
): string => {
    const monthIndex = day === "first" ? 0 : 11;
    const dayNumber = day === "first" ? 1 : 31;
    const date = new Date(new Date().getFullYear(), monthIndex, dayNumber);
    return formatDate(date, delimeter, "YY:MM:DD");
};

export const getCurrentDateAndTime = (dateCurrent: string) => {
    const date = new Date(dateCurrent).toLocaleDateString();
    const time = new Date(dateCurrent).toLocaleTimeString("en-US", {
        hour12: false,
        hour: "numeric",
        minute: "numeric",
    });
    return `${date} at ${time}`;
};

export const convertToString = (value?: number) => {
    if (value == undefined || Number.isNaN(value)) {
        return "";
    } else {
        return value?.toString();
    }
};
